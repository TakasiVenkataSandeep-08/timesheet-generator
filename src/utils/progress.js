/**
 * Progress indicator utilities
 */

// Lazy-load ora (ESM module)
let oraModule = null;
async function getOra() {
  if (!oraModule) {
    oraModule = await import("ora");
  }
  return oraModule.default;
}

/**
 * Create a spinner for async operations
 */
async function createSpinner(text) {
  const ora = await getOra();
  return ora({
    text,
    spinner: "dots",
    color: "cyan",
  });
}

/**
 * Show progress for a long-running operation
 */
async function withProgress(text, operation) {
  const spinner = await createSpinner(text);
  spinner.start();

  try {
    const result = await operation();
    spinner.succeed(`${text} ✓`);
    return result;
  } catch (error) {
    spinner.fail(`${text} ✗`);
    throw error;
  }
}

/**
 * Update spinner text
 */
function updateSpinner(spinner, text) {
  if (spinner) {
    spinner.text = text;
  }
}

/**
 * Create a progress bar (for operations with known total)
 */
async function createProgressBar(total, initialText = "Processing") {
  const spinner = await createSpinner(`${initialText} (0/${total})`);
  let current = 0;

  return {
    start() {
      spinner.start();
    },
    update(increment = 1) {
      current = Math.min(current + increment, total);
      spinner.text = `${initialText} (${current}/${total})`;
    },
    set(value) {
      current = Math.min(value, total);
      spinner.text = `${initialText} (${current}/${total})`;
    },
    succeed(text) {
      spinner.succeed(text || `${initialText} completed`);
    },
    fail(text) {
      spinner.fail(text || `${initialText} failed`);
    },
    stop() {
      spinner.stop();
    },
  };
}

/**
 * Show progress for multiple items with concurrency control
 */
async function withItemProgress(items, operation, options = {}) {
  const {
    itemText = "item",
    totalText = "Processing",
    showItemName = true,
    concurrency = 1,
  } = options;

  const progressBar = await createProgressBar(items.length, totalText);
  progressBar.start();

  const results = [];
  const errors = [];
  let completed = 0;

  if (concurrency === 1) {
    // Sequential processing (original behavior)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemName =
        showItemName && typeof item === "string"
          ? item
          : `${itemText} ${i + 1}`;

      try {
        const result = await operation(item, i);
        results.push(result);
        completed++;
        progressBar.set(completed);
      } catch (error) {
        errors.push({ item, error });
        completed++;
        progressBar.set(completed);
        if (process.env.DEBUG) {
          console.warn(`Failed to process ${itemName}:`, error.message);
        }
      }
    }
  } else {
    // Parallel processing with concurrency control
    const processItem = async (item, index) => {
      const itemName =
        showItemName && typeof item === "string"
          ? item
          : `${itemText} ${index + 1}`;

      try {
        const result = await operation(item, index);
        results.push(result);
        return { success: true, index };
      } catch (error) {
        errors.push({ item, error });
        if (process.env.DEBUG) {
          console.warn(`Failed to process ${itemName}:`, error.message);
        }
        return { success: false, index };
      }
    };

    // Process items in batches
    const batches = [];
    for (let i = 0; i < items.length; i += concurrency) {
      batches.push(items.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      const batchPromises = batch.map((item, batchIndex) => {
        const globalIndex = items.indexOf(item);
        return processItem(item, globalIndex);
      });

      await Promise.all(batchPromises);
      completed += batch.length;
      progressBar.set(completed);
    }

    // Sort results to maintain original order
    results.sort((a, b) => {
      const aIndex = items.findIndex((item) => item === a.item || item === a);
      const bIndex = items.findIndex((item) => item === b.item || item === b);
      return aIndex - bIndex;
    });
  }

  if (errors.length > 0) {
    progressBar.fail(`${totalText} completed with ${errors.length} error(s)`);
  } else {
    progressBar.succeed(`${totalText} completed`);
  }

  return { results, errors };
}

module.exports = {
  createSpinner,
  createProgressBar,
  withProgress,
  withItemProgress,
  updateSpinner,
};

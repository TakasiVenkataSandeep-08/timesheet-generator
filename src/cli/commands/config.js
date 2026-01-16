const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const ConfigLoader = require('../../config/loader');

/**
 * Interactive config wizard
 */
async function configWizard() {
  console.log('📋 Timesheet Generator Configuration Wizard\n');

  const configLoader = new ConfigLoader();
  const currentConfig = configLoader.load();

  const questions = [
    {
      type: 'list',
      name: 'dateRange',
      message: 'Default date range:',
      choices: ['last-week', 'this-week', 'last-month', 'this-month'],
      default: currentConfig.defaults?.dateRange || 'last-week',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Default author (or "auto" to detect from git):',
      default: currentConfig.defaults?.author || 'auto',
    },
    {
      type: 'list',
      name: 'branches',
      message: 'Default branch filter:',
      choices: ['all', 'main', 'master', 'custom'],
      default: currentConfig.defaults?.branches === 'all' ? 'all' : 'main',
    },
    {
      type: 'input',
      name: 'customBranch',
      message: 'Custom branch pattern:',
      when: (answers) => answers.branches === 'custom',
    },
    {
      type: 'confirm',
      name: 'excludeMerges',
      message: 'Exclude merge commits by default?',
      default: currentConfig.defaults?.excludeMerges !== false,
    },
    {
      type: 'input',
      name: 'workStart',
      message: 'Work hours start (HH:mm):',
      default: currentConfig.defaults?.workHours?.start || '09:00',
      validate: (input) => /^\d{2}:\d{2}$/.test(input) || 'Please enter time in HH:mm format',
    },
    {
      type: 'input',
      name: 'workEnd',
      message: 'Work hours end (HH:mm):',
      default: currentConfig.defaults?.workHours?.end || '17:00',
      validate: (input) => /^\d{2}:\d{2}$/.test(input) || 'Please enter time in HH:mm format',
    },
    {
      type: 'confirm',
      name: 'excludeWeekends',
      message: 'Exclude weekends?',
      default: currentConfig.defaults?.excludeWeekends !== false,
    },
    {
      type: 'confirm',
      name: 'excludeHolidays',
      message: 'Exclude holidays?',
      default: currentConfig.defaults?.excludeHolidays || false,
    },
    {
      type: 'input',
      name: 'holidayCountry',
      message: 'Holiday country code (e.g., US, GB):',
      default: currentConfig.defaults?.holidayCountry || 'US',
      when: (answers) => answers.excludeHolidays,
    },
    {
      type: 'list',
      name: 'format',
      message: 'Default output format:',
      choices: ['json', 'csv', 'markdown', 'jira', 'simple', 'pdf', 'html'],
      default: currentConfig.output?.format || 'json',
    },
    {
      type: 'input',
      name: 'gapThreshold',
      message: 'Gap threshold for session grouping (minutes):',
      default: currentConfig.timeEstimation?.gapThreshold || 30,
      validate: (input) => !isNaN(parseInt(input)) || 'Please enter a number',
    },
  ];

  const answers = await inquirer.prompt(questions);

  // Build config object
  const config = {
    defaults: {
      author: answers.author,
      dateRange: answers.dateRange,
      branches: answers.branches === 'custom' ? answers.customBranch : answers.branches,
      excludeMerges: answers.excludeMerges,
      workHours: {
        start: answers.workStart,
        end: answers.workEnd,
        timezone: 'auto',
      },
      excludeWeekends: answers.excludeWeekends,
      excludeNonWorkHours: false,
      excludeHolidays: answers.excludeHolidays,
      ...(answers.excludeHolidays && {
        holidayCountry: answers.holidayCountry,
        holidayState: null,
        customHolidays: [],
      }),
    },
    timeEstimation: {
      method: 'intelligent',
      gapThreshold: parseInt(answers.gapThreshold),
      minSessionDuration: 15,
      maxSessionDuration: 480,
      baseTimePerCommit: 10,
    },
    output: {
      format: answers.format,
      includeStats: false,
      includeFileChanges: false,
      groupBy: 'day',
    },
  };

  // Write config file
  const configPath = path.join(process.cwd(), '.timesheetrc');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(`\n✅ Configuration saved to ${configPath}`);
  console.log('\nYou can now run: timesheet generate');
}

module.exports = { configWizard };


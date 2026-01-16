#!/bin/bash

# npm Publishing Script for timesheet-generator
# This script ensures all checks pass before publishing

set -e

echo "🚀 Starting npm publishing workflow..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "⚠️  Warning: Not in a git repository"
fi

# Run tests
echo "📋 Running tests..."
npm test

# Check test coverage
echo "📊 Checking test coverage..."
npm run test:coverage

# Check if version is updated
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Check if CHANGELOG.md is updated
if [ -f CHANGELOG.md ]; then
    if ! grep -q "\[$CURRENT_VERSION\]" CHANGELOG.md 2>/dev/null; then
        echo "⚠️  Warning: CHANGELOG.md may not be updated for version $CURRENT_VERSION"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "✅ CHANGELOG.md updated for version $CURRENT_VERSION"
    fi
else
    echo "ℹ️  No CHANGELOG.md found (skipping check)"
fi

# Build check (if there's a build step)
if grep -q '"build"' package.json; then
    echo "🔨 Running build..."
    npm run build
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Dry run
echo "🧪 Running npm publish --dry-run..."
npm publish --dry-run

# Final confirmation
read -p "Ready to publish version $CURRENT_VERSION to npm? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Publishing to npm..."
    npm publish
    echo "✅ Published successfully!"
    
    # Create git tag
    read -p "Create git tag v$CURRENT_VERSION? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag "v$CURRENT_VERSION"
        echo "✅ Tag created: v$CURRENT_VERSION"
        echo "💡 Don't forget to push: git push origin v$CURRENT_VERSION"
    fi
else
    echo "❌ Publishing cancelled"
    exit 1
fi


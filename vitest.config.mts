import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8',
            include: ["src/**/**/*.ts"],
            exclude: ["src/**/**/types.ts"],
        },
        globals: true,
        setupFiles: ['./vitest.setup.mts'],
        mockReset: true,
        clearMocks: true,
        restoreMocks: true,
    },
})
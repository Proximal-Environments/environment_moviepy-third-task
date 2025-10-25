import { EnvironmentDefinition, Logger, runSimpleTests, SimpleTest, TestResult } from '@proximal/packages/base';

// Use this to execute commands (will be tracked automatically)
import { execute } from '@proximal/packages/base';

class Environment implements EnvironmentDefinition {

  async listProblems(): Promise<{ id: string; prompt: string; default?: boolean }[]> {
    const problems: { id: string; prompt: string; default?: boolean }[] = [
        // Write your problems here 
    ];

    return problems;
  }

  async setupProblem(problemId: string): Promise<void> {
    // Implement setup logic for each problem
  }

  async runTests(problemId: string, logger: Logger): Promise<TestResult[]> {
    // Setup for tests
    
    const tests: SimpleTest[] = [
      // Define your tests here
    ];
    
    return runSimpleTests(tests, logger);
  }
}

export default new Environment();

import { EnvironmentDefinition, Logger, runSimpleTests, SimpleTest, TestResult } from '@proximal/packages/base';

// Use this to execute commands (will be tracked automatically)
import { execute } from '@proximal/packages/base';

class Environment implements EnvironmentDefinition {

  async listProblems(): Promise<{ id: string; prompt: string; default?: boolean }[]> {
    const problems: { id: string; prompt: string; default?: boolean }[] = [
      {
        id: 'opaque_overlay_demos',
        prompt: `Make MoviePy's compositing respect clip opacity and transparent backgrounds. When with_opacity adds a mask or bg_color=None keeps a transparent canvas, compose_on must alpha-blend colors (A over B) and treat masks correctly so partially transparent layers keep showing what is underneath instead of turning the stack opaque.`,
        default: true,
      },
      {
        id: 'opaque_overlay_demos_detailed',
        prompt: `Make MoviePy's compositing respect clip opacity:

  - In moviepy/video/VideoClip.py, update VideoClip.compose_on
    to perform proper alpha blending whenever the clip has a mask
    (from .with_opacity) or the background already carries one. Align
    any masks to the blit region, blend colors using standard “A
    over B” math, and return both the blended frame and the updated
    mask. Keep the fast path (just copy pixels, mask stays None) when
    neither layer is transparent.
  - In moviepy/video/compositing/CompositeVideoClip.py, thread masks
    through frame_function: start from the background frame/mask, call
    the updated compose_on for each playing child, and cache the mask
    when memoizing. Treat bg_color=None as a transparent background
    instead of forcing solid black.

  The end result should be that opaque_overlay_demo shows a teal mix
  (green at 30 % over blue) and mask_ignored_demo shows a translucent
  white square (20 % over red) instead of opaque blocks.
`,
        default: false,
      },
    ];

    return problems;
  }

  async setupProblem(problemId: string): Promise<void> {
    execute("pip install -e .", { cwd: '/root/proximal/workspace' });
  }

  async runTests(problemId: string, logger: Logger): Promise<TestResult[]> {
    // Stash agent-generated code
    execute("bash -lc 'git add -A && git stash push -u -m \"agent-changes\" || true'", { cwd: '/root/proximal/workspace' });

    execute("git restore --source origin/testing-branch -- proximal-testing", { cwd: '/root/proximal/workspace' });
    execute("git checkout solution-branch", { cwd: '/root/proximal/workspace' });
    
    // Render baseline opaque videos
    console.log("🎥 Rendering baseline opaque videos...");
    execute("python proximal-testing/example_videos/opaque_overlay_demos.py --suffix _baseline", { cwd: '/root/proximal/workspace' });

    execute("git checkout -f base-branch", { cwd: '/root/proximal/workspace' });
    execute("git stash pop || true", { cwd: '/root/proximal/workspace' });

    // Render test videos with agent changes
    console.log("🎥 Rendering test videos with agent changes...");
    execute("python proximal-testing/example_videos/opaque_overlay_demos.py --suffix _test", { cwd: '/root/proximal/workspace' });

    const demoNames = [
      'opaque_overlay_demo_hee',
      'mask_ignored_demo_hee',
      'background_transparency_demo_hee',
      'dual_mask_blend_demo_hee',
      'clipped_mask_demo_hee',
    ];
    
    const tests: SimpleTest[] = demoNames.map(demoName => ({
      id: `ssim_${demoName}`,
      name: `SSIM > 0.97 for ${demoName}`,
      description: `Verify that the SSIM between baseline and test video for ${demoName} is above 0.97`,
      run: async () => {
        const baselineVideo = `proximal-testing/example_videos/out/${demoName}_baseline.mp4`;
        const testVideo = `proximal-testing/example_videos/out/${demoName}_test.mp4`;
        
        try {
          // Use the test_visual_similarity.sh script
          execute(
            `bash proximal-testing/testing_scripts/test_visual_similarity.sh ${baselineVideo} ${testVideo} 0.97`,
            { cwd: '/root/proximal/workspace' }
          );
          
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: `Visual similarity test failed for ${demoName}: ${error}`,
          };
        }
      },
    }));
    
    return runSimpleTests(tests, logger);
  }
}

export default new Environment();

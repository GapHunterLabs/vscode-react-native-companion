import * as vscode from 'vscode';

/**
 * Port of ReviewPrompt.kt. Asks the user to rate the extension on the
 * Marketplace, once, after a real number of commands launched from
 * this extension (Run Android/iOS, Start Metro, Build releases) --
 * never on install, never on a timer. Counts invocations directly
 * instead of tracking a set of seen keys.
 *
 * Threshold is deliberately lower than the detector-based companions'
 * (5, not 10) -- an explicit action invocation is a much stronger
 * signal of real value than a passive finding the extension noticed
 * on its own. Matches the IntelliJ sibling plugin's threshold.
 *
 * Persisted via `ExtensionContext.globalState` (not workspaceState) --
 * how many times this extension has been used isn't tied to any one
 * workspace, and neither is whether the user already answered.
 */

const HITS_BEFORE_PROMPT = 5;

const KEY_HIT_COUNT = 'reactNativeCompanion.review.hitCount';
const KEY_ANSWERED = 'reactNativeCompanion.review.answered';

// Marketplace only assigns this extension a listing URL once the first
// manual publish goes through -- vendor page is a real, working
// fallback until then, same approach as the IntelliJ sibling plugin.
const MARKETPLACE_URL = 'https://marketplace.visualstudio.com/publishers/GapHunterLabs';

/**
 * Call this once per real command launched. Safe to call multiple
 * times; a no-op once the user has already answered.
 */
export function recordHit(context: vscode.ExtensionContext): void {
  if (context.globalState.get<boolean>(KEY_ANSWERED, false)) {
    return;
  }

  const count = context.globalState.get<number>(KEY_HIT_COUNT, 0) + 1;
  void context.globalState.update(KEY_HIT_COUNT, count);

  if (count === HITS_BEFORE_PROMPT) {
    showPrompt(context);
  }
}

function showPrompt(context: vscode.ExtensionContext): void {
  const rateAction = 'Rate on Marketplace';
  const dismissAction = "Don't ask again";

  void vscode.window
    .showInformationMessage(
      `React Native Device Companion: you've used this ${HITS_BEFORE_PROMPT} times -- if it's saved you time, a rating on the Marketplace helps other developers find it.`,
      rateAction,
      dismissAction,
    )
    .then((selection) => {
      if (selection === rateAction) {
        void context.globalState.update(KEY_ANSWERED, true);
        void vscode.env.openExternal(vscode.Uri.parse(MARKETPLACE_URL));
      } else if (selection === dismissAction) {
        void context.globalState.update(KEY_ANSWERED, true);
      }
      // No selection (dismissed by clicking away): leave unanswered so
      // it can prompt again after the next real hit, same behavior as
      // the notification-balloon version simply timing out.
    });
}

import * as vscode from 'vscode';

export class TimeTracker {
  private static instance: TimeTracker;
  private sessionTimeMs: number = 0;
  private lastFocusTime: number = Date.now();
  private isFocused: boolean = true;

  private constructor() {
    this.isFocused = vscode.window.state.focused;
    if (this.isFocused) {
      this.lastFocusTime = Date.now();
    }

    vscode.window.onDidChangeWindowState((e) => {
      if (e.focused) {
        // Gained focus
        this.isFocused = true;
        this.lastFocusTime = Date.now();
      } else {
        // Lost focus
        this.isFocused = false;
        this.sessionTimeMs += (Date.now() - this.lastFocusTime);
      }
    });
  }

  public static getInstance(): TimeTracker {
    if (!TimeTracker.instance) {
      TimeTracker.instance = new TimeTracker();
    }
    return TimeTracker.instance;
  }

  public getSessionTimeMs(): number {
    if (this.isFocused) {
      return this.sessionTimeMs + (Date.now() - this.lastFocusTime);
    }
    return this.sessionTimeMs;
  }

  public getFormattedSessionTime(): string {
    const totalMinutes = Math.floor(this.getSessionTimeMs() / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}

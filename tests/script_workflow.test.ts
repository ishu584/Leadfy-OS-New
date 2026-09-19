import { describe, it, expect } from "vitest";
import { isValidScriptTransition } from "../schemas/script";

describe("Manual Scripting Workflow Tests", () => {
  it("enforces strict linear transitions", () => {
    expect(isValidScriptTransition("DRAFT", "ASSIGNED")).toBe(true);
    expect(isValidScriptTransition("ASSIGNED", "IN_REVIEW")).toBe(true);
    expect(isValidScriptTransition("IN_REVIEW", "SENT_TO_CLIENT")).toBe(true);
    expect(isValidScriptTransition("SENT_TO_CLIENT", "APPROVED")).toBe(true);
    expect(isValidScriptTransition("SENT_TO_CLIENT", "REVISION_REQUIRED")).toBe(true);
    expect(isValidScriptTransition("APPROVED", "READY_FOR_SHOOT")).toBe(true);
  });

  it("CRITICAL RULE: Prevents marking READY_FOR_SHOOT before client approval", () => {
    // Cannot jump from DRAFT to READY_FOR_SHOOT
    expect(isValidScriptTransition("DRAFT", "READY_FOR_SHOOT")).toBe(false);

    // Cannot jump from IN_REVIEW to READY_FOR_SHOOT
    expect(isValidScriptTransition("IN_REVIEW", "READY_FOR_SHOOT")).toBe(false);

    // Cannot jump from SENT_TO_CLIENT directly to READY_FOR_SHOOT without APPROVED
    expect(isValidScriptTransition("SENT_TO_CLIENT", "READY_FOR_SHOOT")).toBe(false);

    // Cannot jump from REVISION_REQUIRED to READY_FOR_SHOOT
    expect(isValidScriptTransition("REVISION_REQUIRED", "READY_FOR_SHOOT")).toBe(false);

    // Only APPROVED can transition to READY_FOR_SHOOT
    expect(isValidScriptTransition("APPROVED", "READY_FOR_SHOOT")).toBe(true);
  });
});

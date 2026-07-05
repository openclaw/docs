---
read_when:
    - 更改菜单栏图标行为
summary: OpenClaw 在 macOS 上的菜单栏图标状态和动画
title: 菜单栏图标
x-i18n:
    generated_at: "2026-07-05T11:27:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7a096ad148e83f368624e750c1e50c965d8a34a6255a09a19c568e7e88a5868
    source_path: platforms/mac/icon.md
    workflow: 16
---

# 菜单栏图标状态

范围：macOS 应用（`apps/macos`）。渲染：`CritterIconRenderer.makeIcon(...)`。动画/状态接线：`CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`。

## 状态

| 状态                  | 触发条件                                  | 视觉效果                                                                                            |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 空闲                  | 默认                                      | 正常眨眼/摆动动画                                                                                  |
| 已暂停                | `isPaused=true`                           | 状态项使用 `appearsDisabled`；无运动                                                                |
| 语音唤醒（大耳朵）    | 听到唤醒词                                | 耳朵缩放到 `1.9x`，并启用 `earHoles=true`（圆形孔洞以提高可读性）；静音后恢复                      |
| 工作中                | `isWorking=true` 或存在活动的 `IconState` | 更快的腿部摆动（`legWiggle` 最高到 `1.0`），并带有小幅水平偏移；叠加在空闲摆动之上 |

当会话有活动作业或工具时，工具活动徽标（SF Symbol 圆标，例如用于 exec 的 `chevron.left.slash.chevron.right`）可以渲染在同一个小动物图标上方。该徽标来自 `IconState`/`ActivityKind`；完整状态模型请参见[菜单栏](/zh-CN/platforms/mac/menu-bar)。

## 语音唤醒耳朵

- 触发：`AppStateStore.shared.triggerVoiceEars(ttl: nil)`，由语音唤醒捕获管线（`VoiceWakeRuntime`）以及语音唤醒调试/测试工具（`VoiceWakeTester`、`VoiceWakeOverlayController`）调用。
- 停止：`stopVoiceEars()`，在捕获完成时调用。
- 完成前的静音窗口：通常为 `2.0s`；如果只听到了触发词且之后没有进一步语音（`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`），则为 `5.0s`。
- 增强期间，空闲眨眼/摆动/腿部/耳朵计时器会暂停（`earBoostActive` 会在 `CritterStatusLabel+Behavior` 中门控动画任务）。

## 形状和尺寸

- 画布：18x18pt 模板图像，渲染到 36x36px 位图后备存储（2x），因此图标在 Retina 上保持清晰。
- 耳朵缩放默认值为 `1.0`；语音增强会设置 `earScale=1.9` 和 `earHoles=true`，且不会改变整体框架。
- 腿部快跑使用最高到 `1.0` 的 `legWiggle`，并带有小幅水平抖动。

## 行为说明

- 耳朵或工作状态没有外部 CLI/broker 开关；两者都由应用信号（`AppState.setWorking`、`AppState.triggerVoiceEars`）在内部驱动，以避免意外抖动。
- 任何新的 TTL 都应保持较短（远低于 10s），这样如果作业挂起，图标可以快速回到基线状态。

## 相关

- [菜单栏](/zh-CN/platforms/mac/menu-bar)
- [macOS 应用](/zh-CN/platforms/macos)

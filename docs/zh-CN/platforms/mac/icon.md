---
read_when:
    - 更改菜单栏图标行为
summary: macOS 上 OpenClaw 的菜单栏图标状态和动画
title: 菜单栏图标
x-i18n:
    generated_at: "2026-05-06T05:29:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# 菜单栏图标状态

作者：steipete · 更新：2025-12-06 · 范围：macOS 应用（`apps/macos`）

- **空闲：** 正常图标动画（眨眼、偶尔摆动）。
- **已暂停：** Status 项使用 `appearsDisabled`；无动作。
- **语音触发（大耳朵）：** 听到唤醒词时，语音唤醒检测器会调用 `AppState.triggerVoiceEars(ttl: nil)`，在采集话语期间保持 `earBoostActive=true`。耳朵会放大（1.9x），并出现圆形耳孔以提高可读性，然后在静默 1 秒后通过 `stopVoiceEars()` 复位。仅由应用内语音流水线触发。
- **工作中（智能体运行中）：** `AppState.isWorking=true` 会驱动一个“尾巴/腿部疾跑”微动效：工作进行中时腿部摆动更快，并带有轻微偏移。目前会在 WebChat 智能体运行期间切换；在接入其他长任务时，也请在其周围添加相同切换。

接入点

- 语音唤醒：运行时/测试器在触发时调用 `AppState.triggerVoiceEars(ttl: nil)`，并在静默 1 秒后调用 `stopVoiceEars()`，以匹配采集窗口。
- 智能体活动：在工作区间周围设置 `AppStateStore.shared.setWorking(true/false)`（WebChat 智能体调用中已完成）。保持区间简短，并在 `defer` 块中重置，避免动画卡住。

形状和尺寸

- 基础图标绘制于 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`。
- 耳朵缩放默认值为 `1.0`；语音增强会设置 `earScale=1.9` 并切换 `earHoles=true`，且不改变整体画框（18×18 pt 模板图像渲染到 36×36 px Retina 后备存储）。
- 疾跑效果使用最高约 ~1.0 的腿部摆动，并带有小幅水平抖动；它会叠加到任何现有的空闲摆动之上。

行为说明

- 耳朵/工作中没有外部 CLI/broker 开关；保持为应用自身信号的内部行为，以避免意外反复切换。
- 保持 TTL 较短（&lt;10s），这样如果任务挂起，图标也能快速回到基线状态。

## 相关内容

- [菜单栏](/zh-CN/platforms/mac/menu-bar)
- [macOS 应用](/zh-CN/platforms/macos)

---
read_when:
    - 更改菜单栏图标行为时
summary: OpenClaw 在 macOS 上的菜单栏图标状态与动画
title: 菜单栏图标
x-i18n:
    generated_at: "2026-04-24T04:05:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# 菜单栏图标状态

作者：steipete · 更新于：2025-12-06 · 范围：macOS 应用（`apps/macos`）

- **空闲：** 正常图标动画（眨眼，偶尔扭动）。
- **暂停：** 状态栏项目使用 `appearsDisabled`；无动画。
- **语音触发（大耳朵）：** 检测到唤醒词时，语音唤醒检测器会调用 `AppState.triggerVoiceEars(ttl: nil)`，在捕获话语期间保持 `earBoostActive=true`。耳朵会放大（1.9 倍），为提升可读性添加圆形耳孔，然后在静音 1 秒后通过 `stopVoiceEars()` 恢复。仅由应用内语音管线触发。
- **工作中（智能体运行中）：** `AppState.isWorking=true` 会驱动一种“尾巴/腿部疾走”的微动画：在工作进行期间，腿部扭动更快，并伴随轻微偏移。目前它是在 WebChat 智能体运行前后切换的；当你接入其他长任务时，也应在其周围添加相同的切换逻辑。

接入点

- 语音唤醒：运行时/测试器在触发时调用 `AppState.triggerVoiceEars(ttl: nil)`，在静音 1 秒后调用 `stopVoiceEars()`，以匹配捕获窗口。
- 智能体活动：在工作区间前后设置 `AppStateStore.shared.setWorking(true/false)`（WebChat 智能体调用中已完成）。保持区间简短，并在 `defer` 块中重置，以避免动画卡住。

形状与尺寸

- 基础图标绘制于 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`。
- 耳朵缩放默认为 `1.0`；语音增强会将 `earScale=1.9` 并切换 `earHoles=true`，同时不改变整体框架（18×18 pt 模板图像渲染到 36×36 px 的 Retina 后备存储中）。
- 疾走动画会让腿部扭动最高达到约 `1.0`，并伴随小幅水平抖动；它会叠加到现有的任意空闲扭动上。

行为说明

- 没有用于控制耳朵/工作状态的外部 CLI/broker 开关；请将其保持为仅由应用自身信号驱动的内部逻辑，以避免意外抖动。
- 保持 TTL 较短（&lt;10 秒），这样如果任务挂起，图标也能快速恢复到基线状态。

## 相关内容

- [菜单栏](/zh-CN/platforms/mac/menu-bar)
- [macOS 应用](/zh-CN/platforms/macos)

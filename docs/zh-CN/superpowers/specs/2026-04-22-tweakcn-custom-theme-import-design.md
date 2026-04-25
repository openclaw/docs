---
x-i18n:
    generated_at: "2026-04-25T01:40:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: cccaaa1b3e472279b7548ad5af5d50162db9e99a731e06be796de64ee9f8c8d8
    source_path: superpowers/specs/2026-04-22-tweakcn-custom-theme-import-design.md
    workflow: 15
---

# Tweakcn 自定义主题导入设计

状态：已于 2026-04-22 在终端中批准

## 摘要

添加一个且仅一个浏览器本地的自定义 Control UI 主题槽位，可通过 tweakcn 分享链接导入。现有内置主题族仍为 `claw`、`knot` 和 `dash`。新的 `custom` 族表现得像一个普通的 OpenClaw 主题族，并且当导入的 tweakcn 负载同时包含 light 和 dark 两套 token 时，支持 `light`、`dark` 和 `system` 模式。

导入的主题仅存储在当前浏览器配置文件中，与其他 Control UI 设置一起保存。它不会写入 Gateway 网关配置，也不会在设备或浏览器之间同步。

## 问题

Control UI 主题系统目前仅支持三个硬编码主题族：

- `ui/src/ui/theme.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/styles/base.css`

用户可以在内置主题族及其模式变体之间切换，但无法在不修改仓库 CSS 的情况下从 tweakcn 导入主题。此次需求的目标比通用主题系统更小：保留这三个内置主题，并添加一个由用户控制、可通过 tweakcn 链接替换的导入槽位。

## 目标

- 保持现有内置主题族不变。
- 只添加一个导入的自定义槽位，而不是主题库。
- 接受 tweakcn 分享链接或直接的 `https://tweakcn.com/r/themes/{id}` URL。
- 仅将导入的主题持久化到浏览器本地存储中。
- 让导入槽位与现有 `light`、`dark` 和 `system` 模式控制一起工作。
- 保持安全的失败行为：错误导入绝不能破坏当前激活的 UI 主题。

## 非目标

- 不做多主题库，也不做浏览器本地导入列表。
- 不做 Gateway 网关侧持久化或跨设备同步。
- 不做任意 CSS 编辑器或原始主题 JSON 编辑器。
- 不自动加载来自 tweakcn 的远程字体资源。
- 不尝试支持只暴露单一模式的 tweakcn 负载。
- 不做超出 Control UI 所需接缝范围的全仓库主题重构。

## 已确定的用户决策

- 保留三个内置主题。
- 添加一个由 tweakcn 驱动的导入槽位。
- 将导入的主题存储在浏览器中，而不是 Gateway 网关配置中。
- 为导入的主题支持 `light`、`dark` 和 `system`。
- 用下一次导入覆盖自定义槽位是预期行为。

## 推荐方案

向 Control UI 主题模型添加第四个主题族 id：`custom`。仅当存在有效的 tweakcn 导入内容时，`custom` 族才可被选择。导入的负载会被标准化为 OpenClaw 专用的自定义主题记录，并与其他 UI 设置一起存储在浏览器本地存储中。

在运行时，OpenClaw 渲染一个受控的 `<style>` 标签，用于定义已解析的自定义 CSS 变量块：

```css
:root[data-theme="custom"] { ... }
:root[data-theme="custom-light"] { ... }
```

这样可将自定义主题变量限制在 `custom` 族范围内，并避免将内联 CSS 变量泄漏到内置主题族中。

## 架构

### 主题模型

更新 `ui/src/ui/theme.ts`：

- 将 `ThemeName` 扩展为包含 `custom`。
- 将 `ResolvedTheme` 扩展为包含 `custom` 和 `custom-light`。
- 更新 `VALID_THEME_NAMES`。
- 更新 `resolveTheme()`，使 `custom` 镜像现有主题族行为：
  - `custom + dark` -> `custom`
  - `custom + light` -> `custom-light`
  - `custom + system` -> 根据操作系统偏好解析为 `custom` 或 `custom-light`

不会为 `custom` 添加旧版别名。

### 持久化模型

使用一个可选的自定义主题负载扩展 `ui/src/ui/storage.ts` 中的 `UiSettings` 持久化：

- `customTheme?: ImportedCustomTheme`

推荐的存储结构：

```ts
type ImportedCustomTheme = {
  sourceUrl: string;
  themeId: string;
  label: string;
  importedAt: string;
  light: Record<string, string>;
  dark: Record<string, string>;
};
```

说明：

- `sourceUrl` 存储标准化后的原始用户输入。
- `themeId` 是从 URL 中提取的 tweakcn 主题 id。
- `label` 为 tweakcn 的 `name` 字段（若存在），否则为 `Custom`。
- `light` 和 `dark` 是已经标准化的 OpenClaw token 映射，而不是原始 tweakcn 负载。
- 导入的负载与其他浏览器本地设置并列存储，并序列化到同一个 local-storage 文档中。
- 如果存储的自定义主题数据在加载时缺失或无效，则忽略该负载；如果持久化的主题族为 `custom`，则回退到 `theme: "claw"`。

### 运行时应用

在 Control UI 运行时中添加一个窄范围的自定义主题样式表管理器，放在 `ui/src/ui/app-settings.ts` 和 `ui/src/ui/theme.ts` 附近维护。

职责：

- 在 `document.head` 中创建或更新一个稳定的 `<style id="openclaw-custom-theme">` 标签。
- 仅当存在有效的自定义主题负载时输出 CSS。
- 当负载被清除时移除样式标签内容。
- 保持内置主题族 CSS 位于 `ui/src/styles/base.css` 中；不要把导入的 token 拼接进已检入的样式表。

当设置被加载、保存、导入或清除时，此管理器都会运行。

### Light 模式选择器

实现应优先使用 `data-theme-mode="light"` 来处理跨主题族的 light 模式样式，而不是对 `custom-light` 做特殊处理。如果现有选择器被固定为 `data-theme="light"` 且需要应用到所有 light 主题族，应在本次工作中一并扩展。

## 导入 UX

更新 `ui/src/ui/views/config.ts` 中的 `Appearance` 部分：

- 在 `Claw`、`Knot` 和 `Dash` 旁边添加一个 `Custom` 主题卡片。
- 当不存在已导入的自定义主题时，将该卡片显示为禁用状态。
- 在主题网格下方添加一个导入面板，包含：
  - 一个用于输入 tweakcn 分享链接或 `/r/themes/{id}` URL 的文本输入框
  - 一个 `Import` 按钮
  - 当已存在自定义负载时的一条 `Replace` 路径
  - 当已存在自定义负载时的一个 `Clear` 操作
- 当存在负载时，显示导入主题的标签和来源主机。
- 如果当前激活主题是 `custom`，导入替换后应立即生效。
- 如果当前激活主题不是 `custom`，导入仅保存新负载，直到用户选择 `Custom` 卡片。

`ui/src/ui/views/config-quick.ts` 中的快速设置主题选择器也应仅在存在负载时显示 `Custom`。

## URL 解析与远程获取

浏览器导入路径接受：

- `https://tweakcn.com/themes/{id}`
- `https://tweakcn.com/r/themes/{id}`

实现应将两种形式都标准化为：

- `https://tweakcn.com/r/themes/{id}`

随后浏览器直接获取标准化后的 `/r/themes/{id}` 端点。

对外部负载应使用一个窄范围 schema 验证器。由于这是一个不可信的外部边界，优先使用 zod schema。

所需的远程字段：

- 顶层 `name`，可选字符串
- `cssVars.theme`，可选对象
- `cssVars.light`，对象
- `cssVars.dark`，对象

如果缺少 `cssVars.light` 或 `cssVars.dark` 之一，则拒绝导入。这是有意为之：已批准的产品行为是完整模式支持，而不是尽力合成缺失的一侧。

## Token 映射

不要盲目镜像 tweakcn 变量。应将一个有边界的子集标准化为 OpenClaw token，并在辅助函数中派生其余部分。

### 直接导入的 token

从每个 tweakcn 模式块中导入：

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`
- `radius`

当存在 `cssVars.theme` 时，从共享部分导入：

- `font-sans`
- `font-mono`

如果某个模式块覆盖了 `font-sans`、`font-mono` 或 `radius`，则以模式本地值为准。

### 为 OpenClaw 派生的 token

导入器基于导入的基础颜色派生 OpenClaw 专用变量：

- `--bg-accent`
- `--bg-elevated`
- `--bg-hover`
- `--panel`
- `--panel-strong`
- `--panel-hover`
- `--chrome`
- `--chrome-strong`
- `--text`
- `--text-strong`
- `--chat-text`
- `--muted`
- `--muted-strong`
- `--accent-hover`
- `--accent-muted`
- `--accent-subtle`
- `--accent-glow`
- `--focus`
- `--focus-ring`
- `--focus-glow`
- `--secondary`
- `--secondary-foreground`
- `--danger`
- `--danger-muted`
- `--danger-subtle`

派生规则应放在一个纯辅助函数中，以便独立测试。具体的颜色混合公式属于实现细节，但该辅助函数必须满足两个约束：

- 保持接近导入主题意图的可读对比度
- 对相同导入负载产生稳定输出

### v1 中忽略的 token

以下 tweakcn token 在第一版中有意忽略：

- `chart-*`
- `sidebar-*`
- `font-serif`
- `shadow-*`
- `tracking-*`
- `letter-spacing`
- `spacing`

这样可以将范围聚焦于当前 Control UI 实际需要的 token。

### 字体

如果存在字体栈字符串，则会导入，但 OpenClaw 在 v1 中不会加载远程字体资源。如果导入的字体栈引用了浏览器中不可用的字体，则按正常回退行为处理。

## 失败行为

错误导入必须以封闭方式失败。

- URL 格式无效：显示内联验证错误，不发起获取。
- 不支持的主机或路径结构：显示内联验证错误，不发起获取。
- 网络失败、非 OK 响应或 JSON 格式错误：显示内联错误，保持当前已存储负载不变。
- Schema 验证失败或缺少 light/dark 块：显示内联错误，保持当前已存储负载不变。
- Clear 操作：
  - 删除已存储的自定义负载
  - 删除受控自定义样式标签的内容
  - 如果当前激活的是 `custom`，则将主题族切换回 `claw`
- 首次加载时已存储的自定义负载无效：
  - 忽略该已存储负载
  - 不输出自定义 CSS
  - 如果持久化的主题族是 `custom`，则回退到 `claw`

在任何情况下，失败的导入都不应让当前文档处于已应用部分自定义 CSS 变量的状态。

## 预期会在实现中变更的文件

主要文件：

- `ui/src/ui/theme.ts`
- `ui/src/ui/storage.ts`
- `ui/src/ui/app-settings.ts`
- `ui/src/ui/views/config.ts`
- `ui/src/ui/views/config-quick.ts`
- `ui/src/styles/base.css`

可能新增的辅助文件：

- `ui/src/ui/custom-theme.ts`
- `ui/src/ui/custom-theme-import.ts`

测试：

- `ui/src/ui/app-settings.test.ts`
- `ui/src/ui/storage.node.test.ts`
- `ui/src/ui/views/config.browser.test.ts`
- 新增针对 URL 解析和负载标准化的聚焦测试

## 测试

最低实现覆盖范围：

- 将分享链接 URL 解析为 tweakcn 主题 id
- 将 `/themes/{id}` 和 `/r/themes/{id}` 标准化为获取 URL
- 拒绝不支持的主机和格式错误的 id
- 验证 tweakcn 负载结构
- 将有效的 tweakcn 负载映射为标准化的 OpenClaw light 和 dark token 映射
- 在浏览器本地设置中加载和保存自定义负载
- 为 `light`、`dark` 和 `system` 解析 `custom`
- 在没有负载时禁用 `Custom` 选择
- 当 `custom` 已激活时立即应用导入主题
- 在清除激活中的自定义主题时回退到 `claw`

手动验证目标：

- 从 Settings 中导入一个已知的 tweakcn 主题
- 在 `light`、`dark` 和 `system` 之间切换
- 在 `custom` 与内置主题族之间切换
- 重新加载页面，并确认导入的自定义主题在本地持久化

## 发布说明

该功能刻意保持小范围。如果后续用户提出多个导入主题、重命名、导出或跨设备同步等需求，应将其视为后续设计。不要在本次实现中预先构建主题库抽象。

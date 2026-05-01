---
read_when:
    - 你正在调试内置插件运行时依赖修复
    - 你正在更改插件启动、Doctor 或包管理器安装行为
    - 你正在维护打包的 OpenClaw 安装或内置插件清单
sidebarTitle: Dependencies
summary: OpenClaw 如何规划、暂存和修复内置插件运行时依赖项
title: 插件依赖解析
x-i18n:
    generated_at: "2026-05-01T07:53:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09245c2b7e2f1fb2a61d64f0f9dc77e7df7da58fd71608c391e3865345b7bc9
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw 不会在软件包安装时安装每个内置插件的完整依赖树。它会先根据配置和插件元数据推导出有效插件计划，然后只为该计划实际可加载的、由 OpenClaw 拥有的内置插件暂存运行时依赖。

本页介绍内置 OpenClaw 插件的打包运行时依赖。第三方插件和自定义插件路径仍使用显式插件安装命令，例如 `openclaw plugins install` 和 `openclaw plugins update`。

## 职责划分

OpenClaw 负责计划和策略：

- 此配置中哪些插件处于启用状态
- 哪些依赖根目录可写或只读
- 何时允许修复
- 启动时暂存哪些插件 ID
- 导入插件运行时模块之前的最终检查

软件包管理器负责依赖收敛：

- 软件包图解析
- 生产依赖、可选依赖和对等依赖处理
- `node_modules` 布局
- 软件包完整性
- 锁文件和安装元数据

实践中，OpenClaw 应决定需要存在什么。`pnpm` 或 `npm` 应让文件系统与该决定匹配。

OpenClaw 还负责每个安装根目录的协调锁。软件包管理器会保护自己的安装事务，但它们不会将 OpenClaw 的清单写入、隔离暂存复制/重命名、最终验证或插件导入，与另一个触碰同一运行时依赖根目录的 Gateway 网关、Doctor 或 CLI 进程串行化。

## 有效插件计划

有效插件计划由配置加上已发现的插件元数据推导而来。以下输入可能会启用内置插件运行时依赖：

- `plugins.entries.<id>.enabled`
- `plugins.allow`、`plugins.deny` 和 `plugins.enabled`
- 旧版渠道配置，例如 `channels.telegram.enabled`
- 需要插件的已配置提供商、模型或 CLI 后端引用
- 内置清单默认值，例如 `enabledByDefault`
- 已安装的插件索引和内置清单元数据

显式禁用优先。已禁用的插件、被拒绝的插件 ID、已禁用的插件系统或已禁用的渠道都不会触发运行时依赖修复。仅持久化的凭证状态也不会启用内置渠道或提供商。

插件计划是稳定输入。生成的依赖物化内容是该计划的输出。

## 启动流程

Gateway 网关启动会解析配置，并在加载插件运行时模块之前构建启动插件查找表。随后，启动流程只会为该计划选中的 `startupPluginIds` 暂存运行时依赖。

对于打包安装，允许在插件导入前进行依赖暂存。暂存完成后，运行时加载器会在禁用安装修复的情况下导入启动插件；此时缺失的依赖物化会被视为加载失败，而不是进入另一轮修复循环。

当启动依赖暂存被延后到 HTTP 绑定之后时，Gateway 网关就绪状态会一直因 `plugin-runtime-deps` 原因而阻塞，直到选中的启动插件依赖已物化并且启动插件运行时已加载。

## 修复运行时机

当以下任一条件为真时，应运行运行时依赖修复：

- 有效插件计划已更改，并新增了需要运行时依赖的内置插件
- 生成的依赖清单不再匹配有效计划
- 预期的已安装软件包哨兵缺失或不完整
- 请求了 `openclaw doctor --fix` 或 `openclaw plugins deps --repair`

不应仅仅因为 OpenClaw 已启动就运行运行时依赖修复。计划未变化且依赖物化完整的正常启动应跳过软件包管理器工作。

编辑配置、启用插件或修复 Doctor 发现项的命令可以进入一次插件计划模式，物化新需要的内置依赖，然后返回正常命令流程。本地 `openclaw onboard` 和 `openclaw configure` 会在成功写入配置后自动执行此操作，因此下一次 Gateway 网关运行不会在启动已经开始之后才发现缺少内置插件软件包。远程新手引导/配置对本地运行时依赖保持只读。

## 热重载规则

可能更改活动插件的热重载路径必须先回到插件计划模式，然后再加载插件运行时。重载应将新的有效插件计划与上一个计划进行比较，为新启用的内置插件暂存缺失依赖，然后加载或重启受影响的运行时。

如果配置重载未更改有效插件计划，则不应修复内置运行时依赖。

## 软件包管理器执行

OpenClaw 会为选中的内置运行时依赖写入生成的安装清单，并在运行时依赖安装根目录中运行软件包管理器。可用时它优先使用 `pnpm`，并回退到 Node 内置的 `npm` 运行器。

`pnpm` 路径使用生产依赖，禁用生命周期脚本，忽略工作区，并将存储保留在安装根目录内：

```bash
pnpm install \
  --prod \
  --ignore-scripts \
  --ignore-workspace \
  --config.frozen-lockfile=false \
  --config.minimum-release-age=0 \
  --config.store-dir=<install-root>/.openclaw-pnpm-store \
  --config.node-linker=hoisted \
  --config.virtual-store-dir=.pnpm
```

`npm` 回退使用安全的 npm 安装包装器，并为生成的安装根目录启用生产依赖、禁用生命周期脚本、禁用工作区模式、禁用审计、禁用 fund 输出、使用旧版对等依赖行为，并启用 package-lock 输出。

安装后，OpenClaw 会先验证暂存的依赖树，然后再使其对运行时依赖根目录可见。隔离暂存会被复制到运行时依赖根目录，并再次验证。

整个修复/物化部分都受安装根目录锁保护。当前锁持有者会记录 PID、可用时的进程启动时间以及创建时间。没有进程启动时间或创建时间证据的旧版锁只会按文件系统年龄回收，因此复用的 Docker PID 1 锁可以恢复，而不会仅按年龄让正常的长时间运行的当前安装过期。

## 安装根目录

打包安装不得修改只读软件包目录。OpenClaw 可以从打包层读取依赖根目录，但会将生成的运行时依赖写入可写暂存位置，例如：

- `OPENCLAW_PLUGIN_STAGE_DIR`
- `$STATE_DIRECTORY`
- `~/.openclaw/plugin-runtime-deps`
- 容器式安装中的 `/var/lib/openclaw/plugin-runtime-deps`

可写根目录是最终物化目标。较旧的只读根目录仅在需要时作为兼容层保留。

当打包的 OpenClaw 更新更改了带版本的可写根目录，但选中的内置插件依赖计划仍由之前的暂存根目录满足时，修复会复用之前的 `node_modules` 树，而不是再次运行软件包管理器。新的带版本根目录仍会获得自己的当前软件包运行时镜像，因此插件代码来自当前 OpenClaw 软件包，而未变化的依赖树会在更新之间共享。复用会跳过具有活动 OpenClaw 运行时依赖锁的先前根目录，因此新根目录不会链接到另一个 Gateway 网关、Doctor 或 CLI 进程当前正在修复的依赖树。

## Doctor 和 CLI 命令

使用 `plugins deps` 检查或修复内置插件运行时依赖物化：

```bash
openclaw plugins deps
openclaw plugins deps --json
openclaw plugins deps --repair
openclaw plugins deps --prune
```

当依赖状态属于更广泛安装健康的一部分时，使用 Doctor：

```bash
openclaw doctor
openclaw doctor --fix
```

`plugins deps` 和 Doctor 操作的是由有效插件计划选中的、OpenClaw 拥有的内置插件运行时依赖。它们不是第三方插件安装或更新命令。

## 故障排除

如果打包安装报告缺少内置运行时依赖：

1. 运行 `openclaw plugins deps --json` 检查选中的计划和缺失软件包。
2. 运行 `openclaw plugins deps --repair` 或 `openclaw doctor --fix` 修复可写依赖暂存区。
3. 如果安装根目录是只读的，请将 `OPENCLAW_PLUGIN_STAGE_DIR` 设置为可写路径并重新运行修复。
4. 如果缺失依赖阻止了启动插件加载，请在修复后重启 Gateway 网关。

在源码检出中，工作区安装通常会提供内置插件依赖。对于源码依赖修复，请运行 `pnpm install`，而不是首先使用打包运行时依赖修复。

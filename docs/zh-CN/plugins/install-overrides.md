---
read_when:
    - 针对本地打包的插件测试新手引导或设置流程
    - 发布前验证插件包
    - 将自动插件安装替换为测试产物
sidebarTitle: Install overrides
summary: 使用设置时安装流程测试打包插件覆盖
title: 插件安装覆盖配置
x-i18n:
    generated_at: "2026-06-27T02:41:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

插件安装覆盖项允许维护者针对特定 npm 包或本地 npm-pack tarball 测试设置时插件安装。它们仅用于 E2E 和包验证。普通用户应使用 [`openclaw plugins install`](/zh-CN/cli/plugins) 安装插件。

<Warning>
覆盖项会执行你提供来源中的插件代码。请仅在隔离的状态目录或一次性测试机器中使用它们。
</Warning>

## 环境

除非同时设置这两个变量，否则覆盖项会被禁用：

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

覆盖项映射是以插件 id 为键的 JSON。值支持：

- `npm:<registry-spec>`，用于 registry 包以及精确版本或标签
- `npm-pack:<path.tgz>`，用于由 `npm pack` 生成的本地 tarball

相对 `npm-pack:` 路径会从当前工作目录解析。

## 行为

当设置时流程要求安装某个插件，且其 id 出现在映射中时，OpenClaw 会使用覆盖项来源，而不是目录、内置或默认 npm 来源。这适用于新手引导以及其他使用共享设置时插件安装器的流程。

覆盖项仍会强制校验预期的插件 id。映射到 `codex` 的 tarball 必须安装一个清单 id 为 `codex` 的插件。

覆盖项不会继承官方可信来源状态。即使目录条目通常代表 OpenClaw 拥有的包，覆盖项也会被视为操作员提供的测试输入。

工作区 `.env` 文件不能启用安装覆盖项。请在启动 OpenClaw 的可信 shell、CI 作业或远程测试命令中设置这些变量。

## 包 E2E

使用隔离的状态目录，确保包安装和安装记录不会触及你的常规 OpenClaw 状态：

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

验证状态目录下安装的包：

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

对于实时提供商 E2E，请在启动测试命令前，从可信 shell 或 CI secret 获取真实 API key。不要打印 key；只报告来源以及 key 是否存在。

---
read_when:
    - 添加/更改端点
    - 调试 CLI ↔ 注册表请求
summary: HTTP API 参考（公共 + CLI 端点 + 认证）。
x-i18n:
    generated_at: "2026-05-12T23:28:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c217e56a38d697d8cc6e1c7f0c6481fd762ecbadcf5629964c1f49781d5405b
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

基础 URL：`https://clawhub.ai`（默认）。

所有 v1 路径都位于 `/api/v1/...` 下。
旧版 `/api/...` 和 `/api/cli/...` 保留用于兼容性（见 `DEPRECATIONS.md`）。
OpenAPI：`/api/v1/openapi.json`。

## 公共目录复用

第三方目录可以使用公共读取端点来列出或搜索 ClawHub 技能。请缓存结果，遵守 `429`/`Retry-After`，将用户链接回规范的 ClawHub 列表（`https://clawhub.ai/<owner>/<slug>`），并避免暗示 ClawHub 为第三方站点背书。不要尝试在公共 API 表面之外镜像隐藏、私有或被审核屏蔽的内容。

Web slug 快捷方式会跨注册表族解析，但 API 客户端应使用读取端点返回的规范 URL，而不是重建路由优先级。

## 速率限制

执行模型：

- 匿名请求：按 IP 执行。
- 已认证请求（有效 Bearer token）：按用户桶执行。
- 如果 token 缺失/无效，行为会回退到 IP 执行。
- 当服务器知道原因时，已认证写入端点不应返回裸的 `Unauthorized`。缺失 token、无效/已撤销 token，以及已删除/被封禁/已禁用账号，都应获得可操作文本，以便 CLI 客户端能告诉用户是什么阻止了他们。

- 读取：每 IP 600/分钟，每 key 2400/分钟
- 写入：每 IP 45/分钟，每 key 180/分钟
- 下载：每 IP 30/分钟，每 key 180/分钟（`/api/v1/download`）

标头：

- 旧版兼容性：`X-RateLimit-Limit`、`X-RateLimit-Remaining`、`X-RateLimit-Reset`
- 标准化：`RateLimit-Limit`、`RateLimit-Remaining`、`RateLimit-Reset`
- 在 `429` 时：`Retry-After`

标头语义：

- `X-RateLimit-Reset`：绝对 Unix epoch 秒数
- `RateLimit-Reset`：距离重置的秒数（延迟）
- `Retry-After`：在 `429` 时重试前需等待的秒数（延迟）

示例 `429` 响应：

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

客户端指南：

- 如果存在 `Retry-After`，请等待对应秒数后再重试。
- 使用带抖动的退避，避免同步重试。
- 如果缺少 `Retry-After`，回退到 `RateLimit-Reset`（或从 `X-RateLimit-Reset` 计算）。

IP 来源：

- 默认使用 `cf-connecting-ip`（Cloudflare）作为客户端 IP。
- ClawHub 使用受信任的转发标头在边缘识别客户端 IP。
- 如果没有可用的受信任客户端 IP，匿名下载请求会使用端点范围的回退桶，而不是一个全局 `ip:unknown` 桶。匿名读取/写入请求仍使用共享 unknown 桶，以便缺失 IP 的路由保持可见且保守。

## 公共端点（无需认证）

### `GET /api/v1/search`

查询参数：

- `q`（必需）：查询字符串
- `limit`（可选）：整数
- `highlightedOnly`（可选）：`true` 表示筛选为高亮技能
- `nonSuspiciousOnly`（可选）：`true` 表示隐藏可疑（`flagged.suspicious`）技能
- `nonSuspicious`（可选）：`nonSuspiciousOnly` 的旧版别名

响应：

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000
    }
  ]
}
```

说明：

- 结果按相关性顺序返回（嵌入相似度 + 精确 slug/name token 加权 + 来自下载量的人气先验）。
- 相关性强于人气。精确的 slug 或显示名称 token 匹配，可以排在下载量多得多但匹配更宽松的结果之前。
- ASCII 文本会按单词和标点边界分词。例如，`personal-map` 包含独立的 `map` token，而 `amap-jsapi-skill` 包含 `amap`、`jsapi` 和 `skill`；因此搜索 `map` 会让 `personal-map` 获得比 `amap-jsapi-skill` 更强的词法匹配。
- 下载量会作为小幅对数缩放先验和并列排序因素使用，而不是主要排名信号。当查询文本匹配较弱时，高下载量技能也可能排名更低。
- 根据调用方筛选条件和当前审核状态，可疑或隐藏的审核状态可能会将技能从公共搜索中移除。

发布者可发现性指南：

- 将用户会直接搜索的术语放在显示名称、摘要和标签中。仅当独立 slug token 也是你希望保留的稳定身份时，才使用它。
- 不要仅为追逐某个查询而重命名 slug，除非新 slug 是更好的长期规范名称。旧 slug 会变成重定向别名，但规范 URL、显示的 slug 和未来搜索摘要会使用新 slug。
- 重命名别名会保留旧 URL 和通过注册表解析的安装的解析能力，但搜索排名基于重命名已索引后的规范技能元数据。现有统计数据保留在该技能上。
- 如果某个技能意外不可见，请先在登录状态下用 `clawhub inspect <slug>` 检查审核状态，再更改与排名相关的元数据。

### `GET /api/v1/skills`

查询参数：

- `limit`（可选）：整数（1–200）
- `cursor`（可选）：任何非 `trending` 排序的分页游标
- `sort`（可选）：`updated`（默认）、`createdAt`（别名：`newest`）、`downloads`、`stars`（别名：`rating`）、`installsCurrent`（别名：`installs`）、`installsAllTime`、`trending`
- `nonSuspiciousOnly`（可选）：`true` 表示隐藏可疑（`flagged.suspicious`）技能
- `nonSuspicious`（可选）：`nonSuspiciousOnly` 的旧版别名

说明：

- `trending` 按最近 7 天的安装量排名（基于遥测）。
- `createdAt` 对新技能抓取是稳定的；当现有技能重新发布时，`updated` 会变化。
- 当 `nonSuspiciousOnly=true` 时，基于游标的排序可能在一页中返回少于 `limit` 的条目，因为可疑技能会在页面取回后被过滤。
- 当存在 `nextCursor` 时，用它继续分页。短页本身并不表示结果结束。

响应：

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

响应：

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

说明：

- 由所有者重命名/合并流程创建的旧 slug 会解析到规范技能。
- `metadata.os`：技能 frontmatter 中声明的 OS 限制（例如 `["macos"]`、`["linux"]`）。未声明时为 `null`。
- `metadata.systems`：Nix 系统目标（例如 `["aarch64-darwin", "x86_64-linux"]`）。未声明时为 `null`。
- 如果技能没有平台元数据，`metadata` 为 `null`。
- `moderation` 仅在技能被标记或所有者正在查看它时包含。

### `GET /api/v1/skills/{slug}/moderation`

返回结构化审核状态。

响应：

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

说明：

- 所有者和审核员可以访问隐藏技能的审核详情。
- 公共调用方仅会对已标记且可见的技能获得 `200`。
- 面向公共调用方的证据会被遮蔽，且只有所有者/审核员才会看到原始片段。

### `POST /api/v1/skills/{slug}/report`

举报技能以供审核员审查。举报是技能级别的，可选择关联到某个版本，并进入技能举报队列。

认证：

- 需要 API token。

请求：

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

响应：

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

用于技能举报接收的审核员/管理员端点。

查询参数：

- `status`（可选）：`open`（默认）、`confirmed`、`dismissed` 或 `all`
- `limit`（可选）：整数（1-200）
- `cursor`（可选）：分页游标

响应：

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

用于解决或重新打开技能举报的审核员/管理员端点。

请求：

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` 和 `dismissed` 需要 `note`；将 `status` 设回 `open` 时可以省略。对已分诊的举报传入 `finalAction: "hide"`，可在同一可审计工作流中隐藏该技能。

### `GET /api/v1/skills/{slug}/versions`

查询参数：

- `limit`（可选）：整数
- `cursor`（可选）：分页游标

### `GET /api/v1/skills/{slug}/versions/{version}`

返回版本元数据 + 文件列表。

- `version.security` 包含规范化扫描验证状态和扫描器详情（VirusTotal + LLM），如果可用。

### `GET /api/v1/skills/{slug}/scan`

返回技能版本的安全扫描验证详情。

查询参数：

- `version`（可选）：具体版本字符串。
- `tag`（可选）：解析一个已标记版本（例如 `latest`）。

说明：

- 如果既未提供 `version` 也未提供 `tag`，则使用最新版本。
- 包含规范化验证状态以及扫描器特定详情。
- `security.capabilityTags` 包含检测到的确定性能力/风险标签，例如 `crypto`、`requires-wallet`、`can-make-purchases`、`can-sign-transactions`、`requires-oauth-token` 和 `posts-externally`。
- 仅当扫描器产生明确判定（`clean`、`suspicious` 或 `malicious`）时，`security.hasScanResult` 才为 `true`。
- `moderation` 是从最新版本派生的当前技能级审核快照。
- 查询历史版本时，请先检查 `moderation.matchesRequestedVersion` 和 `moderation.sourceVersion`，再将 `moderation` 和 `security` 视为同一版本上下文。

### `GET /api/v1/skills/{slug}/file`

返回原始文本内容。

查询参数：

- `path`（必需）
- `version`（可选）
- `tag`（可选）

说明：

- 默认使用最新版本。
- 文件大小限制：200KB。

### `GET /api/v1/packages`

统一目录端点，适用于：

- 技能
- 代码插件
- bundle 插件

查询参数：

- `limit`（可选）：整数（1–100）
- `cursor`（可选）：分页游标
- `family`（可选）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（可选）：`official`、`community` 或 `private`
- `isOfficial`（可选）：`true` 或 `false`
- `executesCode`（可选）：`true` 或 `false`
- `capabilityTag`（可选）：插件包的能力过滤器
- `target` / `hostTarget`（可选）：`host:<target>` 的简写
- `os`、`arch`、`libc`（可选）：主机能力过滤器的简写
- `requiresBrowser`、`requiresDesktop`、`requiresNativeDeps`、
  `requiresExternalService`、`requiresBinary`、`requiresOsPermission`
  （可选）：环境要求标签的 `true`/`1` 简写
- `externalService`、`binary`、`osPermission`（可选）：具名环境要求标签的简写
- `artifactKind`（可选）：`legacy-zip` 或 `npm-pack`
- `npmMirror`（可选）：`true`/`1`，用于显示可通过 npm 镜像获得的 ClawPack 支持的包版本

说明：

- `GET /api/v1/code-plugins` 和 `GET /api/v1/bundle-plugins` 仍然是固定族别别名。
- Skills 条目仍由 skill registry 支持，并且仍然只能通过 `POST /api/v1/skills` 发布。
- `POST /api/v1/packages` 仍然只用于 code-plugin 和 bundle-plugin 发布。
- 匿名调用者只能看到公共包渠道。
- 已认证调用者可以在列表/搜索结果中看到他们所属发布者的私有包。
- `channel=private` 只返回已认证调用者可读取的包。

### `GET /api/v1/packages/search`

跨 Skills + 插件包的统一目录搜索。

查询参数：

- `q`（必需）：查询字符串
- `limit`（可选）：整数（1–100）
- `family`（可选）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（可选）：`official`、`community` 或 `private`
- `isOfficial`（可选）：`true` 或 `false`
- `executesCode`（可选）：`true` 或 `false`
- `capabilityTag`（可选）：插件包的能力过滤器
- `target` / `hostTarget`、`os`、`arch`、`libc`、`requiresBrowser`、
  `requiresDesktop`、`requiresNativeDeps`、`requiresExternalService`、
  `requiresBinary`、`requiresOsPermission`、`externalService`、`binary` 和
  `osPermission` 可作为常见能力标签的简写
- `artifactKind`（可选）：`legacy-zip` 或 `npm-pack`
- `npmMirror`（可选）：`true`/`1`，用于搜索可通过 npm 镜像获得的 ClawPack 支持的包版本

说明：

- 匿名调用者只能看到公共包渠道。
- 已认证调用者可以搜索他们所属发布者的私有包。
- `channel=private` 只返回已认证调用者可读取的包。
- 构件过滤器由已索引的能力标签支持：
  `artifact:legacy-zip`、`artifact:npm-pack` 和 `npm-mirror:available`。

### `GET /api/v1/packages/{name}`

返回包详情元数据。

说明：

- Skills 也可以通过统一目录中的此路由解析。
- 私有包会返回 `404`，除非调用者可读取所属发布者。

### `DELETE /api/v1/packages/{name}`

软删除一个包及其所有发布版本。

说明：

- 需要包所有者、组织发布者所有者/管理员、平台审核员或平台管理员的 API 令牌。

### `GET /api/v1/packages/{name}/versions`

返回版本历史。

查询参数：

- `limit`（可选）：整数（1–100）
- `cursor`（可选）：分页游标

说明：

- 私有包会返回 `404`，除非调用者可读取所属发布者。

### `GET /api/v1/packages/{name}/versions/{version}`

返回一个包版本，包括文件元数据、兼容性、能力、验证、构件元数据和扫描数据。

说明：

- 对于旧世界包归档，`version.artifact.kind` 为 `legacy-zip`；对于 ClawPack 支持的发布版本，则为 `npm-pack`。
- ClawPack 发布版本包含 npm 兼容的 `npmIntegrity`、`npmShasum` 和 `npmTarballName` 字段。
- 当存在扫描数据时，会包含 `version.sha256hash`、`version.vtAnalysis`、`version.llmAnalysis` 和 `version.staticScan`。
- 私有包会返回 `404`，除非调用者可读取所属发布者。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

返回包版本的显式构件解析器元数据。

说明：

- 旧版包版本返回一个 `legacy-zip` 构件和旧版 ZIP `downloadUrl`。
- ClawPack 版本返回一个 `npm-pack` 构件、npm 完整性字段、一个 `tarballUrl`，以及旧版 ZIP 兼容 URL。
- 这是 OpenClaw 解析器表面；它避免从共享 URL 猜测归档格式。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

通过显式解析器路径下载版本构件。

说明：

- ClawPack 版本会流式传输精确上传的 npm-pack `.tgz` 字节。
- 旧版 ZIP 版本会重定向到 `/api/v1/packages/{name}/download?version=`。
- 使用下载速率桶。

### `GET /api/v1/packages/{name}/readiness`

返回为未来 OpenClaw 消费计算出的就绪状态。

就绪检查涵盖：

- 官方渠道状态
- 最新版本可用性
- ClawPack npm-pack 构件可用性
- 构件摘要
- 源仓库和提交来源
- OpenClaw 兼容性元数据
- 主机目标
- 扫描状态

响应：

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

用于列出官方 OpenClaw 插件迁移行的审核员端点。

认证：

- 需要审核员或管理员用户的 API 令牌。

查询参数：

- `phase`（可选）：`planned`、`published`、`clawpack-ready`、
  `legacy-zip-only`、`metadata-ready`、`blocked`、`ready-for-openclaw` 或
  `all`（默认）。
- `limit`（可选）：整数（1-100）
- `cursor`（可选）：分页游标

响应：

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

用于创建或更新官方插件迁移行的管理员端点。

认证：

- 需要管理员用户的 API 令牌。

请求体：

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

说明：

- `bundledPluginId` 会规范化为小写，并且是稳定的 upsert 键。
- `packageName` 会按 npm 名称规范化；对于计划中的迁移，包可以缺失。
- 这只跟踪迁移就绪状态。它不会改变 OpenClaw 或生成 ClawPack。

### `GET /api/v1/packages/moderation/queue`

用于包发布审核队列的审核员/管理员端点。

认证：

- 需要审核员或管理员用户的 API 令牌。

查询参数：

- `status`（可选）：`open`（默认）、`blocked`、`manual` 或 `all`
- `limit`（可选）：整数（1-100）
- `cursor`（可选）：分页游标

状态含义：

- `open`：可疑、恶意、待处理、已隔离、已吊销或已举报的发布版本。
- `blocked`：已隔离、已吊销或恶意的发布版本。
- `manual`：任何具有手动审核覆盖的发布版本。
- `all`：任何具有手动覆盖、非干净扫描状态或包举报的发布版本。

响应：

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

举报一个包以供审核员审查。举报是包级别的，可选择关联到某个版本。它们会进入审核队列，但本身不会自动隐藏或阻止下载；审核员应使用发布版本审核来批准、隔离或吊销构件。

认证：

- 需要 API 令牌。

请求：

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

响应：

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

用于包举报接收的审核员/管理员端点。

认证：

- 需要审核员或管理员用户的 API 令牌。

查询参数：

- `status`（可选）：`open`（默认）、`confirmed`、`dismissed` 或 `all`
- `limit`（可选）：整数（1-100）
- `cursor`（可选）：分页游标

响应：

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

用于包审核可见性的所有者/审核员端点。

认证：

- 需要包所有者、发布者成员、审核员或管理员用户的 API 令牌。

响应：

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

用于解决或重新打开包举报的审核员/管理员端点。

请求：

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` 对 `confirmed` 和 `dismissed` 是必需的；将 `status` 设回 `open` 时可以省略它。将 `finalAction: "quarantine"` 或 `finalAction: "revoke"` 与已确认的报告一起传入，可在同一个可审计工作流中应用发布审核措施。

响应：

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

用于软件包发布审核的版主/管理员端点。

请求：

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

支持的状态：

- `approved`：已手动审核并允许。
- `quarantined`：已阻止，等待后续处理。
- `revoked`：在某个发布先前被信任后将其阻止。

被隔离和撤销的发布会在制品下载路由返回 `403`。
每次变更都会写入一条审计日志记录。

### `POST /api/v1/packages/backfill/artifacts`

仅限管理员使用的维护端点，用于为较旧的软件包发布标记显式的制品类型元数据。

请求正文：

```json
{
  "cursor": null,
  "batchSize": 100,
  "dryRun": true
}
```

响应：

```json
{
  "ok": true,
  "scanned": 100,
  "updated": 12,
  "nextCursor": "cursor...",
  "done": false,
  "dryRun": true
}
```

说明：

- 默认是演练模式。
- 没有 ClawPack 存储的发布会标记为 `legacy-zip`。
- 缺少 `artifactKind` 的现有 ClawPack 后端行会被修复为 `npm-pack`。
- 这不会生成 ClawPack，也不会更改制品字节。

### `GET /api/v1/packages/{name}/file`

返回软件包文件的原始文本内容。

查询参数：

- `path`（必需）
- `version`（可选）
- `tag`（可选）

说明：

- 默认使用最新发布。
- 使用读取速率桶，而不是下载速率桶。
- 二进制文件返回 `415`。
- 文件大小限制：200KB。
- 待处理的 VirusTotal 扫描不会阻止读取；恶意发布仍可能在其他位置被拦截。
- 私有软件包会返回 `404`，除非调用方可以读取所属发布者。

### `GET /api/v1/packages/{name}/download`

下载软件包发布的旧版确定性 ZIP 归档。

查询参数：

- `version`（可选）
- `tag`（可选）

说明：

- 默认使用最新发布。
- 技能会重定向到 `GET /api/v1/download`。
- 插件/软件包归档是带有 `package/` 根目录的 zip 文件，因此旧版 OpenClaw 客户端可以继续工作。
- 此路由保持仅支持 ZIP。它不会流式传输 ClawPack `.tgz` 文件。
- 响应包含 `ETag`、`Digest`、`X-ClawHub-Artifact-Type` 和 `X-ClawHub-Artifact-Sha256` 标头，用于解析器完整性检查。
- 仅注册表元数据不会注入到下载的归档中。
- 待处理的 VirusTotal 扫描不会阻止下载；恶意发布会返回 `403`。
- 私有软件包会返回 `404`，除非调用方是所有者。

### `GET /api/npm/{package}`

返回 ClawPack 后端软件包版本的 npm 兼容 packument。

说明：

- 仅列出已上传 ClawPack npm-pack tarball 的版本。
- 旧版仅 ZIP 版本会被有意省略。
- `dist.tarball`、`dist.integrity` 和 `dist.shasum` 使用 npm 兼容字段，因此用户可以选择将 npm 指向该镜像。
- 作用域软件包 packument 同时支持 `/api/npm/@scope/name` 和 npm 的编码请求路径 `/api/npm/@scope%2Fname`。

### `GET /api/npm/{package}/-/{tarball}.tgz`

为 npm 镜像客户端流式传输精确上传的 ClawPack tarball 字节。

说明：

- 使用下载速率桶。
- 下载标头包含 ClawHub SHA-256 以及 npm integrity/shasum 元数据。
- 仍会应用审核和私有软件包访问检查。

### `GET /api/v1/resolve`

由 CLI 用于将本地指纹映射到已知版本。

查询参数：

- `slug`（必需）
- `hash`（必需）：包指纹的 64 字符十六进制 sha256

响应：

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

下载某个技能版本的 zip。

查询参数：

- `slug`（必需）
- `version`（可选）：semver 字符串
- `tag`（可选）：标签名称（例如 `latest`）

说明：

- 如果既没有提供 `version` 也没有提供 `tag`，则使用最新版本。
- 软删除的版本返回 `410`。
- 下载统计按每小时唯一身份计数（API 令牌有效时为 `userId`，否则为 IP）。

## 身份验证端点（Bearer token）

所有端点都需要：

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

验证令牌并返回用户句柄。

### `POST /api/v1/skills`

发布新版本。

- 首选：包含 `payload` JSON + `files[]` blob 的 `multipart/form-data`。
- 也接受包含 `files`（基于 storageId）的 JSON 正文。
- 可选载荷字段：`ownerHandle`。存在时，API 会在服务器端解析该发布者，并要求操作者拥有发布者访问权限。
- 可选载荷字段：`migrateOwner`。当它与 `ownerHandle` 一起为 `true` 时，如果操作者是当前发布者和目标发布者上的管理员/所有者，现有技能可以移动到该所有者。如果没有这个显式选择加入，所有者变更会被拒绝。

### `POST /api/v1/packages`

发布 code-plugin 或 bundle-plugin 版本。

- 需要 Bearer 令牌身份验证。
- 首选：包含 `payload` JSON + `files[]` blob 的 `multipart/form-data`。
- 也接受包含 `files`（基于 storageId）的 JSON 正文。
- 可选载荷字段：`ownerHandle`。存在时，只有管理员可以代表该所有者发布。

验证要点：

- `family` 必须是 `code-plugin` 或 `bundle-plugin`。
- 插件软件包需要 `openclaw.plugin.json`。ClawPack `.tgz` 上传必须在 `package/openclaw.plugin.json` 包含它。
- 代码插件需要 `package.json`、源代码仓库元数据、源提交元数据、配置架构元数据、`openclaw.compat.pluginApi` 和 `openclaw.build.openclawVersion`。
- `openclaw.hostTargets` 和 `openclaw.environment` 是可选元数据。
- 只有受信任的发布者可以发布到 `official` 渠道。
- 代表发布仍会针对目标所有者账号验证 official-channel 资格。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

软删除/恢复某个技能（所有者、版主或管理员）。

可选 JSON 正文：

```json
{ "reason": "Held for moderation pending legal review." }
```

存在时，`reason` 会作为技能审核备注存储，并复制到审计日志中。
所有者发起的软删除会保留该 slug 30 天，之后该 slug 可以由另一个发布者声明。
当此到期适用时，删除响应包含 `slugReservedUntil`。
版主/管理员隐藏和安全移除不会以这种方式到期。

删除响应：

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

状态码：

- `200`：正常
- `401`：未授权
- `403`：禁止
- `404`：未找到技能/用户
- `500`：内部服务器错误

### `POST /api/v1/users/publisher`

仅限管理员。确保某个句柄存在组织发布者。如果该句柄仍指向旧版共享用户/个人发布者，此端点会先将其迁移为组织发布者。

- 正文：`{ "handle": "openclaw", "displayName": "OpenClaw", "trusted": true }`
- 响应：`{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true }`

### `POST /api/v1/users/reserve`

仅限管理员。为合法所有者预留根 slug 和软件包名称，而不发布版本。软件包名称会变成没有发布行的私有占位软件包，因此同一个所有者之后可以将真正的 code-plugin 或 bundle-plugin 发布到该名称。

- 正文：`{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- 响应：`{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### 所有者 slug 管理端点

- `POST /api/v1/skills/{slug}/rename`
  - 正文：`{ "newSlug": "new-canonical-slug" }`
  - 响应：`{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 正文：`{ "targetSlug": "canonical-target-slug" }`
  - 响应：`{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

说明：

- 两个端点都需要 API 令牌身份验证，并且仅适用于技能所有者。
- `rename` 会将以前的 slug 保留为重定向别名。
- `merge` 会隐藏源列表，并将源 slug 重定向到目标列表。

### 转移所有权端点

- `POST /api/v1/skills/{slug}/transfer`
  - 正文：`{ "toUserHandle": "target_handle", "message": "optional" }`
  - 响应：`{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - 响应（接受/拒绝/取消）：`{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - 响应形状：`{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

封禁用户并硬删除其拥有的技能（仅限版主/管理员）。

正文：

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

或

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

响应：

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

解除用户封禁并恢复符合条件的技能（仅限管理员）。

正文：

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

或

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

响应：

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/role`

更改用户角色（仅限管理员）。

正文：

```json
{ "handle": "user_handle", "role": "moderator" }
```

或

```json
{ "userId": "users_...", "role": "admin" }
```

响应：

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

列出或搜索用户（仅限管理员）。

查询参数：

- `q`（可选）：搜索查询
- `query`（可选）：`q` 的别名
- `limit`（可选）：最大结果数（默认 20，最大 200）

响应：

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

添加/移除星标（高亮）。两个端点都是幂等的。

响应：

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## 旧版 CLI 端点（已弃用）

仍支持旧版 CLI 版本：

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/sync`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

移除计划见 `DEPRECATIONS.md`。

## 注册表发现（`/.well-known/clawhub.json`）

CLI 可以从站点发现注册表/身份验证设置：

- `/.well-known/clawhub.json`（JSON，首选）
- `/.well-known/clawdhub.json`（旧版）

架构：

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

如果你自行托管，请提供此文件（或显式设置 `CLAWHUB_REGISTRY`；旧版为 `CLAWDHUB_REGISTRY`）。

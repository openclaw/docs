---
read_when:
    - 添加/更改端点
    - 调试 CLI ↔ 注册表请求
summary: HTTP API 参考（公共 + CLI 端点 + 凭证）。
x-i18n:
    generated_at: "2026-07-01T05:27:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

基础 URL：`https://clawhub.ai`（默认）。

所有 v1 路径都位于 `/api/v1/...` 下。
旧版 `/api/...` 和 `/api/cli/...` 为兼容性保留（见 `DEPRECATIONS.md`）。
OpenAPI：`/api/v1/openapi.json`。

## 公共目录复用

第三方目录可以使用公共读取端点来列出或搜索 ClawHub Skills。请缓存结果，遵守 `429`/`Retry-After`，将用户链接回规范的 ClawHub 列表页（`https://clawhub.ai/<owner>/skills/<slug>`），并避免暗示 ClawHub 为第三方站点背书。不要尝试在公共 API 表面之外镜像隐藏、私有或被审核屏蔽的内容。

Web slug 快捷方式会跨注册表家族解析，但 API 客户端应使用读取端点返回的规范 URL，而不是重建路由优先级。

## 速率限制

执行模型：

- 匿名请求：按 IP 执行。
- 已认证请求（有效 Bearer token）：按用户桶执行。
- 如果 token 缺失/无效，行为会回退到按 IP 执行。
- 当服务器知道原因时，已认证写入端点不应返回裸 `Unauthorized`。缺失 token、无效/已吊销 token，以及已删除/封禁/禁用账号，都应获得可操作的文本，以便 CLI 客户端告诉用户是什么阻止了他们。

- 读取：每 IP 每分钟 3000 次，每 key 每分钟 12000 次
- 写入：每 IP 每分钟 300 次，每 key 每分钟 3000 次
- 下载：每 IP 每分钟 1200 次，每 key 每分钟 6000 次（下载端点）

标头：

- 旧版兼容：`X-RateLimit-Limit`、`X-RateLimit-Reset`
- 标准化：`RateLimit-Limit`、`RateLimit-Reset`
- 在 `429` 上：`X-RateLimit-Remaining: 0` 和 `RateLimit-Remaining: 0`
- 在 `429` 上：`Retry-After`

标头语义：

- `X-RateLimit-Reset`：绝对 Unix epoch 秒数
- `RateLimit-Reset`：距离重置的秒数（延迟）
- `X-RateLimit-Remaining` / `RateLimit-Remaining`：存在时表示精确剩余额度。
  分片成功请求会省略此标头，而不是返回近似的全局值。
- `Retry-After`：在 `429` 上重试前要等待的秒数（延迟）

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

- 如果存在 `Retry-After`，请等待相应秒数后再重试。
- 使用带抖动的退避，避免同步重试。
- 如果缺少 `Retry-After`，回退到 `RateLimit-Reset`（或从 `X-RateLimit-Reset` 计算）。

IP 来源：

- 仅当部署显式启用可信转发标头时，才使用可信客户端 IP 标头，包括 `cf-connecting-ip`。
- ClawHub 使用可信转发标头在边缘识别客户端 IP。
- 如果没有可用的可信客户端 IP，匿名请求会使用仅按速率限制类型限定的回退桶。这些回退桶不包含调用方提供的路径、slug、包名、版本、查询字符串或其他工件参数。

## 错误响应

公共 v1 错误响应是纯文本，带有 `content-type: text/plain; charset=utf-8`。
这包括校验失败（`400`）、缺失公共资源（`404`）、认证和权限失败（`401`/`403`）、速率限制（`429`）以及被阻止的下载。客户端应将响应正文作为人类可读字符串读取。未知查询参数会为了兼容性被忽略，但已识别查询参数的无效值会返回 `400`。

## 公共端点（无需认证）

### `GET /api/v1/search`

查询参数：

- `q`（必需）：查询字符串
- `limit`（可选）：整数
- `highlightedOnly`（可选）：`true` 表示筛选为高亮 Skills
- `nonSuspiciousOnly`（可选）：`true` 表示隐藏可疑（`flagged.suspicious`）Skills
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
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

说明：

- 结果按相关性顺序返回（嵌入相似度 + 精确 slug/name token 加权 + 小的流行度先验）。
- 相关性强于流行度。精确的 slug 或 display-name token 匹配，可以排在互动更强但匹配更宽松的结果前面。
- ASCII 文本会按单词和标点边界分词。例如，`personal-map` 包含独立的 `map` token，而 `amap-jsapi-skill` 包含 `amap`、`jsapi` 和 `skill`；因此搜索 `map` 时，`personal-map` 的词法匹配会强于 `amap-jsapi-skill`。
- 流行度经过对数缩放并设置上限。当查询文本匹配较弱时，高互动 Skills 的排名可能更低。
- 可疑或隐藏的审核状态可能会根据调用方筛选器和当前审核状态，从公共搜索中移除某个 Skill。

发布者可发现性指南：

- 将用户会实际搜索的词放入显示名称、摘要和标签中。只有当独立 slug token 也是你想保留的稳定身份时，才使用它。
- 不要只是为了追逐某个查询而重命名 slug，除非新 slug 是更好的长期规范名称。旧 slug 会变成重定向别名，但规范 URL、显示的 slug 和未来搜索摘要会使用新 slug。
- 重命名别名会保留旧 URL 和通过注册表解析的安装的解析能力，但搜索排名基于重命名完成索引后的规范 Skill 元数据。现有统计会保留在该 Skill 上。
- 如果某个 Skill 意外不可见，请在登录后先用 `clawhub inspect @owner/slug` 检查审核状态，再更改排名相关元数据。

### `GET /api/v1/skills`

查询参数：

- `limit`（可选）：整数（1–200）
- `cursor`（可选）：用于任何非 `trending` 排序的分页游标
- `sort`（可选）：`updated`（默认）、`recommended`（别名：`default`）、`createdAt`（别名：`newest`）、`downloads`、`stars`（别名：`rating`）、旧版安装别名 `installsCurrent`/`installs`/`installsAllTime` 映射到 `downloads`、`trending`
- `nonSuspiciousOnly`（可选）：`true` 表示隐藏可疑（`flagged.suspicious`）Skills
- `nonSuspicious`（可选）：`nonSuspiciousOnly` 的旧版别名

无效的 `sort` 值会返回 `400`。

说明：

- `recommended` 使用互动和新近度信号。
- `trending` 按最近 7 天的安装量排名（基于遥测）。
- `createdAt` 对新 Skill 爬取是稳定的；`updated` 会在现有 Skills 重新发布时变化。
- 当 `nonSuspiciousOnly=true` 时，基于游标的排序可能在一页中返回少于 `limit` 的条目，因为可疑 Skills 会在页面检索后被过滤。
- 存在 `nextCursor` 时，使用它继续分页。短页本身并不表示结果结束。

响应：

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
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
    "topics": ["Productivity"],
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

- 由所有者重命名/合并流程创建的旧 slug 会解析到规范 Skill。
- `metadata.os`：Skill frontmatter 中声明的 OS 限制（例如 `["macos"]`、`["linux"]`）。未声明时为 `null`。
- `metadata.systems`：Nix 系统目标（例如 `["aarch64-darwin", "x86_64-linux"]`）。未声明时为 `null`。
- 如果 Skill 没有平台元数据，`metadata` 为 `null`。
- 只有当 Skill 被标记或所有者正在查看它时，才会包含 `moderation`。

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

- 所有者和审核员可以访问隐藏 Skills 的审核详情。
- 公共调用方仅会对已标记且可见的 Skills 获得 `200`。
- 公共调用方的证据会被脱敏，并且只有所有者/审核员才能看到原始片段。

### `POST /api/v1/skills/{slug}/report`

报告某个 Skill 以供审核员审查。报告是 Skill 级别的，可选关联到一个版本，并进入 Skill 报告队列。

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

用于 Skill 报告接收的审核员/admin 端点。

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

用于解决或重新打开 Skill 报告的审核员/admin 端点。

请求：

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` 对 `confirmed` 和 `dismissed` 是必需的；当将 `status` 设回 `open` 时可以省略。对已分流的报告传入 `finalAction: "hide"`，即可在同一可审计工作流中隐藏该 Skill。

### `GET /api/v1/skills/{slug}/versions`

查询参数：

- `limit`（可选）：整数
- `cursor`（可选）：分页游标

### `GET /api/v1/skills/{slug}/versions/{version}`

返回版本元数据 + 文件列表。

- `version.security` 包含规范化的扫描验证状态和扫描器详情（VirusTotal + LLM），如果可用。

### `GET /api/v1/skills/{slug}/scan`

返回某个 Skill 版本的安全扫描验证详情。

查询参数：

- `version`（可选）：特定版本字符串。
- `tag`（可选）：解析带标签的版本（例如 `latest`）。

说明：

- 如果未提供 `version` 或 `tag`，则使用最新版本。
- 包含规范化后的验证状态以及特定扫描器的详细信息。
- 只有当扫描器给出确定性判定（`clean`、`suspicious` 或 `malicious`）时，`security.hasScanResult` 才为 `true`。
- `moderation` 是从最新版本派生的当前 Skills 级别审核快照。
- 查询历史版本时，在将 `moderation` 和 `security` 视为同一版本上下文之前，请检查 `moderation.matchesRequestedVersion` 和 `moderation.sourceVersion`。

### `POST /api/v1/skills/-/scan`

用于新 ClawScan 作业的已认证提交端点。

不再支持本地上传扫描。使用
`multipart/form-data` 或 `{ "source": { "kind": "upload" } }` 的请求会返回 `410`。

已发布扫描使用 JSON：

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

说明：

- 扫描请求负载和可下载报告会在保留窗口过后从扫描请求存储中过期。
- 已发布扫描需要所有者/发布者管理访问权限，或平台版主/管理员权限。
- 只有当 `update: true` 且扫描成功完成时，已发布扫描才会写回。
- 响应为 `202`，包含 `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`。
- 扫描作业是异步的。手动扫描请求会优先于常规发布/回填工作，但完成时间仍取决于 worker 可用性。

### `GET /api/v1/skills/-/scan/{scanId}`

用于已提交扫描的已认证轮询端点。

- 返回 queued/running/succeeded/failed 状态。
- 排队时返回 `queue.queuedAhead` 和 `queue.position`，以便客户端显示该请求前面还有多少个优先级手动扫描。非常大的队列会被限制并以 `queuedAheadIsEstimate: true` 报告。
- 可用时，`report` 包含 `clawscan`、`skillspector`、`staticAnalysis` 和 `virustotal` 分区。
- 失败的扫描作业会返回 `status: "failed"` 和 `lastError`。

### `GET /api/v1/skills/-/scan/{scanId}/download`

已认证报告归档端点。

- 需要成功完成的扫描；非终态扫描返回 `409`。
- 返回一个 ZIP，其中包含 `manifest.json`、`clawscan.json`、`skillspector.json`、`static-analysis.json`、`virustotal.json` 和 `README.md`。

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

用于已提交版本的已认证已存储报告归档端点。

- 需要该技能或插件的所有者/发布者管理访问权限，或平台版主/管理员权限。
- 返回精确提交版本的已存储扫描结果，包括被阻止或隐藏的版本。
- `kind` 默认为 `skill`；对插件/包扫描使用 `kind=plugin`。
- 返回与扫描请求下载相同形状的 ZIP。

### `POST /api/v1/skills/-/scan/batch`

仅管理员可用的规范批量重新扫描路由。它接受与旧版 `POST /api/v1/skills/-/rescan-batch` 相同的负载形状。

### `POST /api/v1/skills/-/scan/batch/status`

仅管理员可用的规范批量状态路由。它接受 `{ "jobIds": ["..."] }`，并返回与旧版 `POST /api/v1/skills/-/rescan-batch/status` 相同的聚合计数器。

### `GET /api/v1/skills/{slug}/verify`

返回 `clawhub skill verify` 使用的 Skill Card 验证信封。

查询参数：

- `version`（可选）：特定版本字符串。
- `tag`（可选）：解析一个带标签的版本（例如 `latest`）。

说明：

- 只有当所选版本有生成的 Skill Card、未被审核判定为恶意软件阻止，并且 ClawScan 验证为干净时，`ok` 才为 `true`。
- 技能身份、发布者身份和所选版本元数据是顶层信封字段（`slug`、`displayName`、`publisherHandle`、`version`、`resolvedFrom`、`tag`、`createdAt`），因此 shell 自动化可以在不解包嵌套包装器的情况下读取它们。
- `security` 是顶层 ClawScan/安全判定。自动化应以 `ok`、`decision`、`reasons` 和 `security.status` 为依据。
- `security.signals` 包含支持性的扫描器证据，例如 `staticScan`、`virusTotal` 和 `skillSpector`。
- `security.signals.dependencyRegistry` 为 v1 响应兼容性而保留，但依赖项注册表存在性扫描器已停用，并且此键始终为 `null`。
- 只有当 ClawHub 在发布或导入期间解析并存储了 GitHub 仓库/ref/commit/path 时，`provenance` 才是 `server-resolved-github-import`；否则为 `unavailable`。

### `POST /api/v1/skills/-/security-verdicts`

返回精确技能版本的当前紧凑安全判定。此集合端点面向已经知道需要显示哪些已安装 ClawHub 技能版本的客户端，例如 OpenClaw Control UI。

请求：

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

说明：

- `items` 必须包含 1-100 个唯一的 `{ slug, version }` 对。
- 结果按条目返回；缺少某个技能或版本不会导致整个响应失败。
- 响应仅包含安全信息。它不包含 Skill Card 数据、生成的卡片状态、制品文件列表或详细扫描器负载。
- `security.signals` 仅包含状态级别的支持性证据；如需完整扫描器详情，请使用 `/scan` 或 ClawHub security-audit 页面。
- `security.signals.dependencyRegistry` 为 v1 响应兼容性而保留，但依赖项注册表存在性扫描器已停用，并且此键始终为 `null`。
- 缺少 Skill Card 不会影响此端点的 `ok`、`decision` 或 `reasons`；当客户端需要卡片内容时，应在本地读取已安装的 `skill-card.md`。
- 当你需要单个技能的 Skill Card 验证信封时使用 `/verify`，需要生成的卡片 Markdown 时使用 `/card`，需要详细扫描器数据时使用 `/scan`。

响应：

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

返回原始文本内容。

查询参数：

- `path`（必填）
- `version`（可选）
- `tag`（可选）

说明：

- 默认使用最新版本。
- 文件大小限制：200KB。

### `GET /api/v1/packages`

统一目录端点，适用于：

- 技能
- 代码插件
- 捆绑插件

查询参数：

- `limit`（可选）：整数（1–100）
- `cursor`（可选）：分页游标
- `family`（可选）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（可选）：`official`、`community` 或 `private`
- `isOfficial`（可选）：`true` 或 `false`
- `sort`（可选）：`updated`（默认）、`recommended`、`trending`、`downloads`、旧版别名 `installs`
- `category`（可选）：插件分类过滤器。仅当请求限定为插件包（`/api/v1/plugins`、`/api/v1/code-plugins`、`/api/v1/bundle-plugins`，或带有 `family=code-plugin`/`family=bundle-plugin` 的包端点）时支持。受控分类和旧版 v1 过滤器别名记录在 `GET /api/v1/plugins` 下。

说明：

- `family`、`channel`、`isOfficial`、`featured`、`highlightedOnly` 或 `sort` 的无效值会返回 `400`。未知查询参数会被忽略。
- `GET /api/v1/code-plugins` 和 `GET /api/v1/bundle-plugins` 仍是固定 family 的别名。
- 技能条目仍由技能注册表支持，并且仍只能通过 `POST /api/v1/skills` 发布。
- `POST /api/v1/packages` 仍仅用于 code-plugin 和 bundle-plugin 发布。
- 匿名调用方只能看到公开包频道。
- 已认证调用方可以在列表/搜索结果中看到其所属发布者的私有包。
- `channel=private` 仅返回已认证调用方可读取的包。

### `GET /api/v1/packages/search`

在技能 + 插件包之间进行统一目录搜索。

查询参数：

- `q`（必填）：查询字符串
- `limit`（可选）：整数（1–100）
- `family`（可选）：`skill`、`code-plugin` 或 `bundle-plugin`
- `channel`（可选）：`official`、`community` 或 `private`
- `isOfficial`（可选）：`true` 或 `false`
- `category`（可选）：插件分类过滤器。仅当请求限定为插件包时支持。受控分类和旧版 v1 过滤器别名记录在 `GET /api/v1/plugins` 下。

说明：

- `family`、`channel`、`isOfficial`、`featured` 或 `highlightedOnly` 的无效值会返回 `400`。未知查询参数会被忽略。
- 匿名调用方只能看到公开包频道。
- 已认证调用方可以搜索其所属发布者的私有包。
- `channel=private` 仅返回已认证调用方可读取的包。

### `GET /api/v1/plugins`

仅插件目录浏览，覆盖 code-plugin 和 bundle-plugin 包。

查询参数：

- `limit`（可选）：整数（1-100）
- `cursor`（可选）：分页游标
- `isOfficial`（可选）：`true` 或 `false`
- `sort`（可选）：`recommended`（默认）、`trending`、`downloads`、`updated`、旧版别名 `installs`
- `category`（可选）：插件分类过滤器。当前值：
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

旧版 v1 过滤器别名在读取端点上仍可接受：

- `mcp-tooling`、`data` 和 `automation` 解析为 `tools`。
- `observability` 和 `deployment` 解析为 `gateway`。
- `dev-tools` 解析为 `runtime`。

`trending` 是七天安装/下载排行榜，不使用历史总量。
在统一 `/api/v1/packages` 端点上，它仅适用于插件；技能目录请使用
`/api/v1/skills?sort=trending`。

旧版别名不能作为已存储或作者声明的分类值接受。

### `GET /api/v1/skills/export`

批量导出最新公开技能，用于离线分析。

认证：

- 需要 API 令牌。

查询参数：

- `startDate`（必填）：技能 `updatedAt` 的 Unix 毫秒下限。
- `endDate`（必填）：技能 `updatedAt` 的 Unix 毫秒上限。
- `limit`（可选）：整数（1-250），默认 `250`。
- `cursor`（可选）：来自上一响应的分页游标。

响应：

- 正文：ZIP 归档。
- 每个导出的技能以 `{publisher}/{slug}/` 为根目录。
- 托管技能包含最新存储版本文件，并在 `_manifest.json` 中以 `sourceRef: "public-clawhub"` 列出。
- 当前由 GitHub 支持且扫描结果为 `clean` 或 `suspicious` 的技能包含 `_source_handoff.json`，其中包含 `sourceRef: "public-github"`、仓库、提交、路径、内容哈希和归档 URL。它们不包含 ClawHub 托管的源文件。
- 每个技能包含 `_export_skill_meta.json`。
- `_manifest.json` 始终包含在 ZIP 根目录。
- 当单个技能或文件无法导出时，会包含 `_errors.json`。

标头：

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

批量导出最新公开插件发布，用于离线分析。

身份验证：

- 需要 API 令牌。

查询参数：

- `startDate`（必填）：插件 `updatedAt` 的 Unix 毫秒下界。
- `endDate`（必填）：插件 `updatedAt` 的 Unix 毫秒上界。
- `limit`（可选）：整数（1-250），默认 `250`。
- `cursor`（可选）：来自上一响应的分页游标。
- `family`（可选）：`code-plugin` 或 `bundle-plugin`。省略表示两个
  插件系列都包含。

响应：

- 正文：ZIP 归档。
- 每个导出的插件都以 `{family}/{packageName}/` 为根目录。
- 每个导出的插件都包含最新发布的已存储文件。
- 每个插件的导出元数据存储在
  `__clawhub_export/{family}/{packageName}/plugin_meta.json`。
- `_manifest.json` 始终包含在 ZIP 根目录。
- 当单个插件或文件无法导出时，会包含 `_errors.json`。

标头：

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

在 code-plugin 和 bundle-plugin 包中进行仅限插件的搜索。

查询参数：

- `q`（必填）：查询字符串
- `limit`（可选）：整数（1-100）
- `isOfficial`（可选）：`true` 或 `false`
- `category`（可选）：插件类别过滤器。当前值：
  `channels`、`models`、`memory`、`context`、`voice`、`media`、`web`、
  `tools`、`runtime`、`gateway`、`security`、`other`。

说明：

- 也接受 `GET /api/v1/plugins` 下记录的旧版 v1 过滤器别名。
- 类别过滤是真正的 API 过滤器，由插件类别摘要行提供支持，
  不是搜索查询重写。
- 结果按相关性顺序返回，目前不分页。
- 插件搜索的浏览器 UI 排序控件会重新排序已加载的相关性结果，
  与当前 `/skills` 浏览行为一致。

### `GET /api/v1/packages/{name}`

返回包详情元数据。

说明：

- Skills 也可以通过统一目录中的此路由解析。
- 私有包返回 `404`，除非调用方可以读取所属发布者。

### `DELETE /api/v1/packages/{name}`

软删除一个包及其所有发布。

说明：

- 需要包所有者、组织发布者所有者/管理员、平台版主或平台管理员的 API 令牌。

### `GET /api/v1/packages/{name}/versions`

返回版本历史。

查询参数：

- `limit`（可选）：整数（1–100）
- `cursor`（可选）：分页游标

说明：

- 私有包返回 `404`，除非调用方可以读取所属发布者。

### `GET /api/v1/packages/{name}/versions/{version}`

返回一个包版本，包括文件元数据、兼容性、验证、制品元数据和扫描数据。

说明：

- 对于旧体系的包归档，`version.artifact.kind` 为 `legacy-zip`；
  对于 ClawPack 支持的发布，则为 `npm-pack`。
- ClawPack 发布包含兼容 npm 的 `npmIntegrity`、`npmShasum` 和
  `npmTarballName` 字段。
- `version.sha256hash` 是面向旧客户端的已弃用兼容性元数据。它对
  `/api/v1/packages/{name}/download` 返回的精确 ZIP 字节进行哈希。
  现代客户端应使用 `version.artifact.sha256`，它标识规范发布制品。
- 当存在扫描数据时，会包含 `version.vtAnalysis`、`version.llmAnalysis` 和
  `version.staticScan`。
- 私有包返回 `404`，除非调用方可以读取所属发布者。

### `GET /api/v1/packages/{name}/versions/{version}/security`

返回供安装客户端使用的精确包发布安全与信任摘要。这是公开的 OpenClaw 使用面，用于决定已解析的发布是否可以安装。

身份验证：

- 公开读取端点。不需要所有者、发布者、版主或管理员令牌。

响应：

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

响应字段：

- `package.name`、`package.displayName` 和 `package.family` 标识已解析的注册表包。
- `release.releaseId`、`release.version` 和 `release.createdAt` 标识被评估的精确发布。
- 当发布制品已知时，会包含 `release.artifactKind`、`release.artifactSha256`、
  `release.npmIntegrity`、`release.npmShasum` 和 `release.npmTarballName`。
- `trust.scanStatus` 是从扫描器输入和手动发布审核派生出的有效信任状态。
- `trust.moderationState` 可为空。当不存在手动发布审核时，它为 `null`。
- `trust.blockedFromDownload` 是安装阻止信号。当此值为 `true` 时，OpenClaw 和其他
  安装客户端应阻止安装，而不是从扫描器或审核字段重新推导阻止规则。
- `trust.reasons` 是面向用户和审计的解释列表。原因代码是稳定、紧凑的字符串，例如
  `manual:quarantined`、`scan:malicious` 和 `package:malicious`。
- `trust.pending` 表示一个或多个信任输入仍在等待完成。
- `trust.stale` 表示信任摘要是根据过期输入计算的，在作出高置信度允许决策前，
  应视为需要刷新。

说明：

- 此端点精确到版本。客户端应在解析出打算安装的包版本后调用它，
  而不是只在读取最新包元数据后调用。
- 私有包返回 `404`，除非调用方可以读取所属发布者。
- 此端点有意比所有者/版主审核端点更窄。它公开安装决策和公开解释，
  而不公开报告者身份、报告正文、私有证据或内部审核时间线。

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

返回包版本的显式制品解析器元数据。

说明：

- 旧版包版本返回 `legacy-zip` 制品和旧版 ZIP `downloadUrl`。
- ClawPack 版本返回 `npm-pack` 制品、npm 完整性字段、`tarballUrl`，
  以及旧版 ZIP 兼容性 URL。
- 这是 OpenClaw 解析器面；它避免从共享 URL 猜测归档格式。

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

通过显式解析器路径下载版本制品。

说明：

- ClawPack 版本流式传输精确上传的 npm-pack `.tgz` 字节。
- 旧版 ZIP 版本重定向到 `/api/v1/packages/{name}/download?version=`。
- 使用下载速率桶。

### `GET /api/v1/packages/{name}/readiness`

返回面向未来 OpenClaw 使用的计算就绪状态。

就绪检查涵盖：

- 官方频道状态
- 最新版本可用性
- ClawPack npm-pack 制品可用性
- 制品摘要
- 源代码仓库和提交来源
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

用于列出官方 OpenClaw 插件迁移行的版主端点。

身份验证：

- 需要版主或管理员用户的 API 令牌。

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

身份验证：

- 需要管理员用户的 API 令牌。

请求正文：

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
- 这只跟踪迁移就绪状态。它不会更改 OpenClaw 或生成 ClawPack。

### `GET /api/v1/packages/moderation/queue`

用于包发布审核队列的版主/管理员端点。

身份验证：

- 需要版主或管理员用户的 API 令牌。

查询参数：

- `status`（可选）：`open`（默认）、`blocked`、`manual` 或 `all`
- `limit`（可选）：整数（1-100）
- `cursor`（可选）：分页游标

状态含义：

- `open`：可疑、恶意、待处理、已隔离、已撤销或已报告的发布。
- `blocked`：已隔离、已撤销或恶意发布。
- `manual`：任何带有手动审核覆盖的发布。
- `all`：任何带有手动覆盖、非干净扫描状态或包报告的发布。

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

报告一个包以供版主审核。报告是包级别的，可选择关联到某个版本。
它们会进入审核队列，但本身不会自动隐藏或阻止下载；版主应使用发布审核来批准、隔离或撤销制品。

身份验证：

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

用于接收软件包举报的版主/管理员端点。

认证：

- 需要版主或管理员用户的 API 令牌。

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

用于查看软件包审核可见性的所有者/版主端点。

认证：

- 需要软件包所有者、发布者成员、版主或
  管理员用户的 API 令牌。

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

用于解决或重新打开软件包举报的版主/管理员端点。

请求：

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` 对 `confirmed` 和 `dismissed` 是必需的；将 `status` 重新设置为 `open` 时可以省略。对已确认举报传入 `finalAction: "quarantine"` 或
`finalAction: "revoke"`，可在同一个可审计工作流中应用发布版本审核。

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

用于软件包发布版本审查的版主/管理员端点。

请求：

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

支持的状态：

- `approved`：已人工审查并允许。
- `quarantined`：已阻止，等待后续处理。
- `revoked`：在某个发布版本此前受信任后阻止。

被隔离和撤销的发布版本会从制品下载路由返回 `403`。每次变更都会写入一条审计日志。

### `GET /api/v1/packages/{name}/file`

返回软件包文件的原始文本内容。

查询参数：

- `path`（必需）
- `version`（可选）
- `tag`（可选）

说明：

- 默认使用最新发布版本。
- 使用读取速率桶，而不是下载速率桶。
- 二进制文件返回 `415`。
- 文件大小限制：200KB。
- 待处理的 VirusTotal 扫描不会阻止读取；恶意发布版本仍可能在其他位置被拦截。
- 私有软件包返回 `404`，除非调用方可以读取拥有它的发布者。

### `GET /api/v1/packages/{name}/download`

下载软件包发布版本的旧版确定性 ZIP 归档。

查询参数：

- `version`（可选）
- `tag`（可选）

说明：

- 默认使用最新发布版本。
- Skills 重定向到 `GET /api/v1/download`。
- 插件/软件包归档是带有 `package/` 根目录的 zip 文件，以便旧版 OpenClaw
  客户端继续工作。
- 此路由保持仅支持 ZIP。它不流式传输 ClawPack `.tgz` 文件。
- 响应包含 `ETag`、`Digest`、`X-ClawHub-Artifact-Type` 和
  `X-ClawHub-Artifact-Sha256` 头，用于解析器完整性检查。
- 仅注册表元数据不会注入到下载的归档中。
- 待处理的 VirusTotal 扫描不会阻止下载；恶意发布版本返回 `403`。
- 私有软件包返回 `404`，除非调用方是所有者。

### `GET /api/npm/{package}`

为 ClawPack 支持的软件包版本返回兼容 npm 的 packument。

说明：

- 只列出已上传 ClawPack npm-pack tarball 的版本。
- 旧版仅 ZIP 版本会被有意省略。
- `dist.tarball`、`dist.integrity` 和 `dist.shasum` 使用兼容 npm 的
  字段，因此用户可以按需将 npm 指向该镜像。
- 作用域软件包 packument 同时支持 `/api/npm/@scope/name` 和 npm 的
  编码请求路径 `/api/npm/@scope%2Fname`。

### `GET /api/npm/{package}/-/{tarball}.tgz`

为 npm 镜像客户端流式传输精确上传的 ClawPack tarball 字节。

说明：

- 使用下载速率桶。
- 下载头包含 ClawHub SHA-256 以及 npm integrity/shasum 元数据。
- 审核和私有软件包访问检查仍会应用。

### `GET /api/v1/resolve`

CLI 用它将本地指纹映射到已知版本。

查询参数：

- `slug`（必需）
- `hash`（必需）：包指纹的 64 字符十六进制 sha256

响应：

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

下载托管的 skill 版本 ZIP，或对具有 `clean` 或 `suspicious` 扫描且没有托管
版本的当前 GitHub 支持 skill，返回 GitHub 源交接信息。

查询参数：

- `slug`（必需）
- `version`（可选）：semver 字符串
- `tag`（可选）：标签名称（例如 `latest`）

说明：

- 如果既未提供 `version` 也未提供 `tag`，则使用最新版本。
- 软删除版本返回 `410`。
- GitHub 支持的 skill 交接不会代理或镜像字节。JSON 响应
  包含 `sourceRef: "public-github"`、`repo`、`commit`、`path`、`contentHash`
  和 `archiveUrl`；扫描/当前状态是门禁，不会作为成功
  载荷元数据包含在内。
- 下载统计按 UTC 日统计唯一身份（API 令牌有效时为 `userId`，否则为 IP）。

## 认证端点（Bearer 令牌）

所有端点都需要：

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

验证令牌并返回用户 handle。

### `POST /api/v1/skills`

发布新版本。

- 首选：带有 `payload` JSON + `files[]` blob 的 `multipart/form-data`。
- 也接受带有 `files`（基于 storageId）的 JSON 正文。
- 可选载荷字段：`ownerHandle`。存在时，API 会在服务端解析该
  发布者，并要求操作者拥有发布者访问权限。
- 可选载荷字段：`migrateOwner`。当与 `ownerHandle` 一起为 `true` 时，如果
  操作者在当前和目标发布者上都是管理员/所有者，现有 skill 可以迁移到该所有者。
  没有此显式选择时，所有者变更会被拒绝。

### `POST /api/v1/packages`

发布 code-plugin 或 bundle-plugin 发布版本。

- 需要 Bearer 令牌认证。
- 需要 `multipart/form-data`。
- 允许的表单字段为 `payload`、重复的 `files` blob，或一个 `clawpack`
  tarball 引用。`clawpack` 可以是 `.tgz` blob，或上传 URL 流程返回的 storage id。暂存的 storage-id 发布还必须包含随该上传 URL 返回的
  `clawpackUploadTicket`。
- 使用 `files` 或 `clawpack` 二者之一，绝不能在同一个请求中同时使用。
- JSON 正文以及调用方提供的 `payload.files` / `payload.artifact`
  元数据会被拒绝。
- 直接 multipart 发布请求上限为 18MB。ClawPack tarball 可以
  通过上传 URL 流程使用，最高到 120MB tarball 上限。
- 可选载荷字段：`ownerHandle`。存在时，只有管理员可以代表该所有者发布。

验证要点：

- `family` 必须是 `code-plugin` 或 `bundle-plugin`。
- 插件软件包需要 `openclaw.plugin.json`。ClawPack `.tgz` 上传必须
  在 `package/openclaw.plugin.json` 包含它。
- 代码插件需要 `package.json`、源仓库元数据、源提交
  元数据、配置 schema 元数据、`openclaw.compat.pluginApi` 和
  `openclaw.build.openclawVersion`。
- `openclaw.hostTargets` 和 `openclaw.environment` 是可选元数据。
- 只有 `openclaw` 组织发布者和当前 `openclaw` 组织成员的
  个人发布者可以发布到 `official` 频道。
- 代表发布仍会针对目标所有者账户验证 official-channel 资格。

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

软删除 / 恢复 skill（所有者、版主或管理员）。

可选 JSON 正文：

```json
{ "reason": "Held for moderation pending legal review." }
```

存在时，`reason` 会存储为 skill 审核备注，并复制到审计日志中。
所有者发起的软删除会保留该 slug 30 天，之后该 slug 可由
另一个发布者认领。删除响应在此到期规则适用时包含 `slugReservedUntil`。
版主/管理员隐藏和安全移除不会以这种方式过期。

删除响应：

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

状态码：

- `200`：正常
- `401`：未授权
- `403`：禁止
- `404`：未找到 skill/用户
- `500`：内部服务器错误

### `POST /api/v1/users/publisher`

仅管理员。确保某个 handle 存在组织发布者。如果该 handle 仍指向
旧版共享用户/个人发布者，该端点会先将其迁移为组织发布者。
对于新创建的组织，请提供 `memberHandle`；执行操作的管理员不会被添加为成员。
`memberRole` 默认为 `owner`。

- 正文：`{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- 响应：`{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

已认证的自助组织发布者创建。创建新的组织发布者并将
调用方添加为所有者。此端点不会迁移现有用户/个人 handle，也不会
将发布者标记为受信任/官方。

- 正文：`{ "handle": "opik", "displayName": "Opik" }`
- 响应：`{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- 当 handle 已被发布者、用户或个人发布者使用时返回 `409`。

### `POST /api/v1/users/reserve`

仅管理员。为合法所有者预留根 slug 和软件包名称，而不发布
发布版本。软件包名称会成为没有发布行的私有占位软件包，因此同一
所有者稍后可以将真实的 code-plugin 或 bundle-plugin 发布版本发布到该名称。

- 正文：`{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- 响应：`{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

仅管理员。为已验证的替代 GitHub OAuth 主体恢复个人发布者，
无需编辑 Convex Auth 账户行。请求必须指定两个不可变的 GitHub
提供商账户 ID；可变 handle 仅作为面向操作者的保护条件使用。

端点默认执行试运行。应用恢复需要在工作人员独立验证两个 GitHub 主体之间的连续性后设置 `dryRun: false` 和
`confirmIdentityVerified: true`。当目标用户当前的个人发布者已有技能、包或 GitHub 技能来源时，恢复会失败并关闭。
恢复还会迁移已恢复发布者的技能、技能 slug 别名、包、包检查器警告以及派生搜索摘要行中的旧版 `ownerUserId` 字段，以便直接所有者路径与新的发布者权限保持一致。已恢复 handle 的活动受保护 handle 预留也会重新分配给替换用户，这样后续个人资料同步就无法恢复原用户的竞争权限。每个主表在每次应用事务中限制为
100 行；更大的恢复必须先使用可恢复的所有者迁移。
GitHub 技能来源是按发布者作用域管理的，并报告为已检查，而不是重写。

- 正文：`{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- 响应：`{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### 所有者 slug 管理端点

- `POST /api/v1/skills/{slug}/rename`
  - 正文：`{ "newSlug": "new-canonical-slug" }`
  - 响应：`{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - 正文：`{ "targetSlug": "canonical-target-slug" }`
  - 响应：`{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

说明：

- 两个端点都需要 API 令牌认证，并且只对技能所有者有效。
- `rename` 会将之前的 slug 保留为重定向别名。
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

### `POST /api/v1/users/reclassify-ban`

更改现有封禁的已存储原因，而不解除封禁或恢复内容（仅限管理员）。除非 `dryRun` 为 `false`，否则默认为试运行。

正文：

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

或

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

响应：

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
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

仍支持较旧的 CLI 版本：

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

移除计划见 `DEPRECATIONS.md`。

`POST /api/cli/upload-url` 返回 `uploadUrl` 和 `uploadTicket`。暂存 ClawPack tarball 的包发布必须将生成的存储 ID 作为
`clawpack` 发送，并将返回的 ticket 作为 `clawpackUploadTicket` 发送。

## 注册表发现（`/.well-known/clawhub.json`）

CLI 可以从站点发现注册表/认证设置：

- `/.well-known/clawhub.json`（JSON，首选）
- `/.well-known/clawdhub.json`（旧版）

架构：

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

如果你自行托管，请提供此文件（或显式设置 `CLAWHUB_REGISTRY`；旧版为 `CLAWDHUB_REGISTRY`）。

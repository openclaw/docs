---
read_when:
    - 发布技能或插件
    - 调试所有者或包作用域错误
    - 添加发布 UI、CLI 或后端行为
summary: ClawHub 发布在 Skills、插件、所有者、作用域、版本发布和审核方面的运作方式。
x-i18n:
    generated_at: "2026-05-11T20:23:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 566c37b7845159ad100837e34bed7c60411bba6a0b3436ab899fe5e345237727
    source_path: clawhub/publishing.md
    workflow: 16
---

# 发布

ClawHub 发布按所有者限定范围：每次发布都以某个发布者为目标，服务器会决定已登录用户是否有权在那里发布。

## 所有者

所有者是 ClawHub 发布者句柄，例如 `@alice` 或 `@openclaw`。个人所有者会为用户创建。组织所有者可以有多个成员。

发布时，你可以使用你的个人所有者，也可以选择你拥有发布者访问权限的组织所有者。

## Skills

Skills 从 skill 文件夹发布。公开页面是：

```text
https://clawhub.ai/<owner>/<slug>
```

示例：

```text
https://clawhub.ai/alice/review-helper
```

发布请求包含所选所有者、slug、版本、变更日志和文件。服务器会在创建发布版本之前，验证操作主体是否可以以该所有者身份发布。

要在发布新版本时将现有 skill 移动到另一个所有者，请选择新的所有者并明确确认所有权迁移。在 CLI/API 中，传入目标所有者以及迁移选择加入参数：

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

Skill 所有者迁移要求对当前所有者和目标所有者都拥有管理员或所有者访问权限。它会保留该 skill、版本历史、统计数据、评论、fork、别名和审计轨迹；旧所有者 URL 会继续通过别名/重定向路径生效。

## 插件

插件使用 npm 风格的包名。带作用域的包名在名称的第一部分包含所有者：

```text
@owner/package-name
```

作用域必须与所选发布所有者匹配。如果你的包名是 `@openclaw/dronzer`，它只能作为 `@openclaw` 发布。如果你作为 `@vintageayu` 发布，请将包重命名为 `@vintageayu/dronzer`。

这会防止包声称发布者并不控制的组织命名空间。

## 发布流程

1. UI、CLI 或 GitHub workflow 收集包元数据和文件。
2. 发布请求会随所选所有者一起发送到 ClawHub。
3. 服务器验证所有者权限、包作用域、包名、版本、文件限制和源元数据。
4. ClawHub 存储发布版本并启动自动安全检查。
5. 新发布版本会在审核和验证完成前，从普通安装/下载入口中隐藏。

如果验证失败，则不会创建发布版本。

## 常见问题

### 包作用域必须与所选所有者匹配

如果包作用域和所选所有者不匹配，ClawHub 会拒绝发布：

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

要修复它，请选择包作用域命名的所有者，或者重命名包，使作用域与你可作为其发布的所有者匹配。

如果包名已经具有正确的作用域，但包归错误的发布者所有，请改为转移所有权：

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

仅当你对当前所有者和目标发布者都拥有管理员访问权限时，才使用包或 skill 转移。包转移不会让你发布到无法管理的作用域中。

这会保护组织命名空间。名为 `@openclaw/dronzer` 的包会声称 `@openclaw` 命名空间，因此只有拥有 `@openclaw` 所有者访问权限的发布者才能发布它。

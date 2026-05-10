---
read_when:
    - 发布技能或插件
    - 调试所有者或包作用域错误
    - 添加发布 UI、CLI 或后端行为
summary: ClawHub 针对 Skills、插件、所有者、作用域、发布版本和审核的发布工作方式。
x-i18n:
    generated_at: "2026-05-10T19:25:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61de013f0ac82acbf20f99c3e0c92c8e31d3de14e9ee64f7bc7659d522747089
    source_path: clawhub/publishing.md
    workflow: 16
---

# 发布

ClawHub 发布按所有者限定范围：每次发布都以某个发布者为目标，服务器会决定已登录用户是否允许发布到那里。

## 所有者

所有者是 ClawHub 发布者句柄，例如 `@alice` 或 `@openclaw`。个人所有者会为用户创建。组织所有者可以有多个成员。

发布时，你可以使用个人所有者，也可以选择你拥有发布者访问权限的组织所有者。

## Skills

Skills 从技能文件夹发布。公开页面是：

```text
https://clawhub.ai/<owner>/<slug>
```

示例：

```text
https://clawhub.ai/alice/review-helper
```

发布请求包含所选所有者、slug、版本、变更日志和文件。服务器会在创建发布版本之前验证执行者是否可以以该所有者身份发布。

若要在发布新版本时将现有技能移到另一个所有者，请选择新的所有者，并明确确认所有权迁移。在 CLI/API 中，传入目标所有者以及迁移选择加入参数：

```sh
clawhub skill publish ./review-helper --owner openclaw --migrate-owner --version 1.2.0
```

技能所有者迁移需要对当前所有者和目标所有者都拥有管理员或所有者访问权限。它会保留技能、版本历史、统计数据、评论、fork、别名和审计轨迹；旧所有者 URL 会继续通过别名/重定向路径生效。

## 插件

插件使用 npm 风格的包名。带作用域的包名会在名称的第一部分包含所有者：

```text
@owner/package-name
```

作用域必须与所选发布所有者匹配。如果你的包名为 `@openclaw/dronzer`，它只能以 `@openclaw` 身份发布。如果你以 `@vintageayu` 身份发布，请将包重命名为 `@vintageayu/dronzer`。

这可以防止包声明发布者无法控制的组织命名空间。

## 发布流程

1. UI、CLI 或 GitHub 工作流收集包元数据和文件。
2. 发布请求会连同所选所有者一起发送到 ClawHub。
3. 服务器会验证所有者权限、包作用域、包名、版本、文件限制和来源元数据。
4. ClawHub 存储发布版本，并启动自动安全检查。
5. 在审核和验证完成之前，新发布版本会从普通安装/下载界面中隐藏。

如果验证失败，则不会创建发布版本。

## 常见问题

### 包作用域必须与所选所有者匹配

如果包作用域与所选所有者不匹配，ClawHub 会拒绝发布：

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

要修复它，请选择包作用域指定的所有者，或者重命名包，使作用域与你可以作为其发布的所有者匹配。

如果包名已经具有正确的作用域，但包由错误的发布者拥有，请改为转移所有权：

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

仅当你对当前包所有者和目标发布者都拥有管理员访问权限时，才使用包转移。它不会让你发布到你无法管理的作用域中。

这会保护组织命名空间。名为 `@openclaw/dronzer` 的包声明了 `@openclaw` 命名空间，因此只有拥有 `@openclaw` 所有者访问权限的发布者才能发布它。

---
read_when:
    - 你想试用 ClawHub 提供的免费促销模型优惠
    - 你正在通过促销活动配置提供商，而不是通过新手引导
summary: '`openclaw promos` 的 CLI 参考（列出并领取模型促销优惠）'
title: 推广活动
x-i18n:
    generated_at: "2026-07-11T20:27:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

发现并领取发布在 ClawHub 上的模型促销优惠。领取促销优惠会配置提供商（需要时包括身份验证和插件）并注册促销优惠中的模型——无需重新运行新手引导，也不会更改你的默认模型，除非你明确要求。

相关内容：

- 默认模型和回退模型：[Models](/zh-CN/cli/models)
- 提供商身份验证设置：[入门指南](/zh-CN/start/getting-started)

## 命令

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

列出当前有效的促销优惠，包括其中的模型、建议的默认模型、剩余时间和确切的领取命令。`--json` 输出原始数据。

## `openclaw promos claim <slug>`

领取有效的促销优惠：

1. 从 ClawHub 获取促销优惠，并验证其处于有效期内。
2. 根据你安装的 OpenClaw 版本，验证促销优惠的提供商、身份验证选项和声明的插件包。未知 ID 或包不匹配的情况会被拒绝——促销优惠绝不会让 CLI 运行任何它尚不知如何执行的内容。
3. 如果你已有提供商凭据，则复用这些凭据。否则，它会引导你完成提供商的常规身份验证流程（首先输出用于获取免费密钥的促销优惠注册网址）。`--api-key <key>` 可无提示地完成 API 密钥身份验证，与 `openclaw onboard` 的非交互式标志保持一致；若要避免在命令行中提供密钥，请改为导出该提供商的环境变量（例如 `OPENROUTER_API_KEY`）——系统会自动检测现有的环境变量凭据，无需使用标志。
4. 注册促销优惠中的模型及其别名。绝不会覆盖现有别名。
5. 询问是否将促销优惠建议的模型设为默认模型——`--set-default` 会跳过此询问；否则，你的默认设置不会发生任何变化。

促销优惠的有效期结束后，提供商将停止提供免费模型；你的配置和凭据不会受到影响。你可以随时使用 `openclaw models set <model>` 切换回其他模型。

## `models list` 中的被动发现

`openclaw models list` 也会显示促销优惠，无需你直接查询 ClawHub：

- 如果有效优惠中的模型尚未配置，它们会显示在表格下方的“可通过促销优惠使用”分组中，每项均附有对应的领取命令。
- 通过 `promos claim` 注册的模型会带有 `promo` 标签；优惠有效期结束后，该标签会变为 `promo ended`。
- 首次发现新优惠时，会显示一次性通知，指向 `openclaw promos list`。已经列出或领取过的优惠不会再次通知。

此功能读取 ClawHub 托管促销优惠源在本地缓存的副本（通常每天通过条件请求刷新一次；如果缓存快照提前过期，则会更早刷新；刷新失败会被静默跳过）。过期缓存的刷新最多等待 2.5 秒，且绝不会导致列表功能中断。`--json` 和 `--plain` 的输出会保持适合机器处理的纯净格式：不包含促销优惠分区或通知。领取时始终会通过实时 ClawHub API 重新验证，因此，即使缓存副本仍显示某项提前撤回的优惠，领取请求也会被拒绝。

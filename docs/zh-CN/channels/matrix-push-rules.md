---
read_when:
    - 为自行托管的 Synapse 或 Tuwunel 设置 Matrix 静默流式传输
    - 用户只希望在分块完成时收到通知，而不是每次编辑预览时都收到通知
summary: 针对静默完成的预览编辑，按收件人配置 Matrix 推送规则
title: Matrix 静默预览的推送规则
x-i18n:
    generated_at: "2026-07-11T20:20:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

当 `channels.matrix.streaming` 为 `"quiet"` 时，OpenClaw 会通过原地编辑单个预览事件来流式传输回复。预览以不触发通知的 `m.notice` 事件发送，最终编辑会标记为 `content["com.openclaw.finalized_preview"] = true`。只有当每用户推送规则与该标记匹配时，Matrix 客户端才会在最终编辑时发送通知。本页面向自行托管 Matrix，并希望为每个接收者账户安装该规则的运维人员。

`streaming: "progress"` 通过相同路径完成其草稿，因此同一规则也会针对进度模式的最终编辑触发。

如果你只需要 Matrix 的默认通知行为，请使用 `streaming: "partial"` 或关闭流式传输。请参阅 [Matrix 渠道设置](/zh-CN/channels/matrix#streaming-previews)。

## 前提条件

- 接收者用户 = 应收到通知的人
- Bot 用户 = 发送回复的 OpenClaw Matrix 账户
- 对于下方的 API 调用，请使用接收者用户的访问令牌
- 在推送规则中，使 `sender` 与 Bot 用户的完整 MXID 匹配
- 接收者账户必须已有正常工作的推送器；仅当常规 Matrix 推送投递正常时，安静预览规则才有效

## 步骤

<Steps>
  <Step title="配置安静预览">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="获取接收者的访问令牌">
    尽可能复用现有的客户端会话令牌。要创建新令牌：

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="验证推送器是否存在">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果未返回任何推送器，请先修复此账户的常规 Matrix 推送投递，然后再继续。

  </Step>

  <Step title="安装覆盖推送规则">
    安装一条同时匹配最终预览标记和作为发送者的 Bot MXID 的规则：

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    运行前请替换：

    - `https://matrix.example.org`：你的主服务器基础 URL
    - `$USER_ACCESS_TOKEN`：接收者用户的访问令牌
    - `openclaw-finalized-preview-botname`：每个接收者对应每个 Bot 的唯一规则 ID（格式：`openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`：你的 OpenClaw Bot MXID，而不是接收者的 MXID

  </Step>

  <Step title="验证">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

然后测试流式回复。在安静模式下，房间会显示不触发通知的草稿预览，并在分块或轮次完成时通知一次。

  </Step>
</Steps>

若要稍后移除该规则，请使用接收者的令牌对同一规则 URL 执行 `DELETE`。

## 多 Bot 说明

推送规则以 `ruleId` 为键：使用相同 ID 重新执行 `PUT` 会更新同一条规则。如果多个 OpenClaw Bot 要通知同一接收者，请为每个 Bot 创建一条规则，并使用不同的发送者匹配条件。

新建的用户定义 `override` 规则会插入到服务器默认抑制规则之前，因此不需要额外的排序参数。该规则仅影响可原地完成的纯文本预览编辑；媒体回复、过期预览回退，以及会激活 Matrix 提及的最终文本，会改为作为正常触发通知的消息投递。

## 主服务器说明

<AccordionGroup>
  <Accordion title="Synapse">
    无需对 `homeserver.yaml` 进行特殊更改。如果常规 Matrix 通知已能送达该用户，主要设置步骤就是使用接收者令牌执行上述 `pushrules` 调用。

    如果你在反向代理或工作进程后运行 Synapse，请确保 `/_matrix/client/.../pushrules/` 能正确到达 Synapse。推送投递由主进程或 `synapse.app.pusher` / 已配置的推送工作进程处理——请确保它们运行正常。

    该规则使用 `event_property_is` 推送规则条件（MSC3758，推送规则 v1.10），Synapse 于 2023 年加入了对此条件的支持。较旧的 Synapse 版本会接受 `PUT pushrules/...` 调用，但该条件始终不会匹配，且不会给出提示——如果最终预览编辑未触发通知，请升级 Synapse。

  </Accordion>

  <Accordion title="Tuwunel">
    流程与 Synapse 相同；最终预览标记不需要任何 Tuwunel 专用配置。

    如果用户在另一台设备上处于活跃状态时通知消失，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 1.4.2（2025 年 9 月）中加入了此选项；当一台设备处于活跃状态时，它可以有意抑制向其他设备发送推送。

  </Accordion>
</AccordionGroup>

## 相关内容

- [Matrix 渠道设置](/zh-CN/channels/matrix)
- [流式传输概念](/zh-CN/concepts/streaming)

---
read_when:
    - 为自托管 Synapse 或 Tuwunel 设置 Matrix 安静流式传输
    - 用户只希望在分块完成时收到通知，而不是在每次预览编辑时都收到通知
summary: 针对安静的最终预览编辑的按接收方划分的 Matrix 推送规则
title: 安静预览的 Matrix 推送规则
x-i18n:
    generated_at: "2026-04-27T06:02:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 15
    postprocess_version: locale-links-v1
---

当 `channels.matrix.streaming` 为 `"quiet"` 时，OpenClaw 会原地编辑单个预览事件，并使用自定义内容标记标识最终完成的编辑。只有当某条按用户设置的推送规则匹配该标记时，Matrix 客户端才会仅对最终编辑发出通知。本页面面向自托管 Matrix 并希望为每个接收方账户安装该规则的运维人员。

如果你只想使用 Matrix 默认的通知行为，请使用 `streaming: "partial"` 或关闭流式传输。参见 [Matrix 渠道设置](/zh-CN/channels/matrix#streaming-previews)。

## 前提条件

- 接收方用户 = 应该收到通知的人
- 机器人用户 = 发送回复的 OpenClaw Matrix 账户
- 对下面的 API 调用使用接收方用户的访问令牌
- 在推送规则中将 `sender` 与机器人用户的完整 MXID 匹配
- 接收方账户必须已经有可用的 pusher —— 安静预览规则仅在普通 Matrix 推送投递正常时才有效

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

  <Step title="获取接收方的访问令牌">
    尽可能复用现有客户端会话令牌。若要签发新的令牌：

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

  <Step title="确认存在 pusher">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果没有返回任何 pusher，请先修复该账户的普通 Matrix 推送投递，再继续。

  </Step>

  <Step title="安装 override 推送规则">
    OpenClaw 会使用 `content["com.openclaw.finalized_preview"] = true` 标记仅文本的最终预览编辑。安装一条规则，使其匹配该标记，并将机器人 MXID 作为发送方进行匹配：

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

    - `https://matrix.example.org`：你的 homeserver 基础 URL
    - `$USER_ACCESS_TOKEN`：接收方用户的访问令牌
    - `openclaw-finalized-preview-botname`：每个机器人、每个接收方唯一的规则 ID（格式：`openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`：你的 OpenClaw 机器人 MXID，而不是接收方的 MXID

  </Step>

  <Step title="验证">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

然后测试一次流式回复。在 quiet 模式下，房间会显示一个安静的草稿预览，并在分块或整轮结束时通知一次。

  </Step>
</Steps>

如果之后要移除该规则，请使用接收方的令牌对同一规则 URL 执行 `DELETE`。

## 多机器人说明

推送规则以 `ruleId` 为键：对同一个 ID 再次执行 `PUT` 会更新同一条规则。若多个 OpenClaw 机器人向同一接收方发送通知，请为每个机器人分别创建一条规则，并使用不同的发送方匹配条件。

新建的用户定义 `override` 规则会插入到默认抑制规则之前，因此不需要额外的排序参数。该规则只影响可原地最终完成的纯文本预览编辑；媒体回退和过期预览回退仍使用普通 Matrix 投递。

## homeserver 说明

<AccordionGroup>
  <Accordion title="Synapse">
    无需对 `homeserver.yaml` 做特殊修改。如果普通 Matrix 通知已经能够送达该用户，那么接收方令牌 + 上面的 `pushrules` 调用就是主要的设置步骤。

    如果你在反向代理或 workers 后面运行 Synapse，请确保 `/_matrix/client/.../pushrules/` 能正确到达 Synapse。推送投递由主进程或 `synapse.app.pusher` / 已配置的 pusher workers 处理 —— 请确保它们运行正常。

    该规则使用 `event_property_is` 推送规则条件（MSC3758，push rule v1.10），此条件于 2023 年添加到 Synapse。较旧的 Synapse 版本会接受 `PUT pushrules/...` 调用，但会静默地永远不匹配该条件 —— 如果最终预览编辑没有触发通知，请升级 Synapse。

  </Accordion>

  <Accordion title="Tuwunel">
    流程与 Synapse 相同；针对最终预览标记，无需任何 Tuwunel 专用配置。

    如果用户在另一台设备上处于活跃状态时通知消失，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 1.4.2（2025 年 9 月）中添加了此选项，它可能会在一台设备活跃时有意抑制向其他设备发送推送。

  </Accordion>
</AccordionGroup>

## 相关内容

- [Matrix 渠道设置](/zh-CN/channels/matrix)
- [流式传输概念](/zh-CN/concepts/streaming)

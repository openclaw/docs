---
read_when:
    - 为自托管 Synapse 或 Tuwunel 设置 Matrix 静默流式传输
    - 用户只希望在块完成时收到通知，而不是每次预览编辑都收到通知
summary: 按收件人配置的 Matrix 推送规则，用于静默的最终预览编辑
title: Matrix 安静预览的推送规则
x-i18n:
    generated_at: "2026-07-05T11:03:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

当 `channels.matrix.streaming` 为 `"quiet"` 时，OpenClaw 会通过原地编辑单个预览事件来流式传输回复。预览会作为不触发通知的 `m.notice` 事件发送，最终编辑会标记为 `content["com.openclaw.finalized_preview"] = true`。Matrix 客户端只有在每用户推送规则匹配该标记时，才会对最终编辑发送通知。本页适用于自托管 Matrix，并希望为每个接收方账号安装该规则的操作员。

`streaming: "progress"` 也会通过同一路径最终确定其草稿，因此同一规则也会对进度模式的最终编辑触发。

如果你只想使用 Matrix 的默认通知行为，请使用 `streaming: "partial"` 或关闭流式传输。参见 [Matrix 渠道设置](/zh-CN/channels/matrix#streaming-previews)。

## 前提条件

- 接收方用户 = 应接收通知的人
- bot 用户 = 发送回复的 OpenClaw Matrix 账号
- 对下面的 API 调用使用接收方用户的访问令牌
- 在推送规则中，将 `sender` 与 bot 用户的完整 MXID 匹配
- 接收方账号必须已有可正常工作的推送器；静默预览规则只有在普通 Matrix 推送投递健康时才有效

## 步骤

<Steps>
  <Step title="配置静默预览">

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
    尽可能复用现有客户端会话令牌。要签发新的令牌：

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

  <Step title="验证推送器存在">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果没有返回任何推送器，请先修复此账号的普通 Matrix 推送投递，再继续。

  </Step>

  <Step title="安装 override 推送规则">
    安装一条规则，用最终预览标记加 bot MXID 作为发送方进行匹配：

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

    运行前替换：

    - `https://matrix.example.org`：你的 homeserver 基础 URL
    - `$USER_ACCESS_TOKEN`：接收方用户的访问令牌
    - `openclaw-finalized-preview-botname`：每个 bot、每个接收方唯一的规则 ID（模式：`openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`：你的 OpenClaw bot MXID，而不是接收方的

  </Step>

  <Step title="验证">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

然后测试一条流式传输回复。在静默模式下，房间会显示静默草稿预览，并在分块或轮次完成时通知一次。

  </Step>
</Steps>

以后要移除该规则，请使用接收方的令牌对同一规则 URL 执行 `DELETE`。

## 多 bot 说明

推送规则按 `ruleId` 作为键：对同一 ID 重新运行 `PUT` 会更新单条规则。对于多个 OpenClaw bot 通知同一接收方的情况，请为每个 bot 创建一条规则，并使用不同的发送方匹配。

新的用户定义 `override` 规则会插入到服务器默认抑制规则之前，因此不需要额外的排序参数。该规则只影响可以原地最终确定的纯文本预览编辑；媒体回复、过期预览回退，以及会激活 Matrix 提及的最终文本，仍会作为普通通知消息投递。

## Homeserver 说明

<AccordionGroup>
  <Accordion title="Synapse">
    不需要特殊的 `homeserver.yaml` 变更。如果普通 Matrix 通知已经能到达该用户，上面的接收方令牌 + `pushrules` 调用就是主要设置步骤。

    如果你在反向代理或 worker 后面运行 Synapse，请确保 `/_matrix/client/.../pushrules/` 能正确到达 Synapse。推送投递由主进程或 `synapse.app.pusher` / 已配置的 pusher worker 处理，请确保它们处于健康状态。

    该规则使用 `event_property_is` 推送规则条件（MSC3758，推送规则 v1.10），Synapse 于 2023 年加入此条件。较旧的 Synapse 版本会接受 `PUT pushrules/...` 调用，但静默地永远无法匹配该条件。如果最终预览编辑没有触发通知，请升级 Synapse。

  </Accordion>

  <Accordion title="Tuwunel">
    流程与 Synapse 相同；最终预览标记不需要 Tuwunel 专用配置。

    如果用户在另一台设备上处于活跃状态时通知消失，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 1.4.2（2025 年 9 月）中加入了此选项，它可能会在一台设备活跃时有意抑制向其他设备的推送。

  </Accordion>
</AccordionGroup>

## 相关

- [Matrix 渠道设置](/zh-CN/channels/matrix)
- [流式传输概念](/zh-CN/concepts/streaming)

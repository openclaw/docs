---
read_when:
    - macOSのSkills設定UIを更新する
    - Skillsの制御やインストール動作を変更する
summary: macOSのSkills設定UIとGatewayバックドのステータス
title: Skills（macOS）
x-i18n:
    generated_at: "2026-04-24T05:08:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcd89d27220644866060d0f9954a116e6093d22f7ebd32d09dc16871c25b988e
    source_path: platforms/mac/skills.md
    workflow: 15
---

macOSアプリはGateway経由でOpenClaw Skillsを表示します。ローカルでSkillsを解析することはありません。

## データソース

- `skills.status`（gateway）は、すべてのSkillsと、その適格性および不足している要件を返します
  （同梱Skillsに対するallowlistブロックを含む）。
- 要件は、各 `SKILL.md` の `metadata.openclaw.requires` から導出されます。

## インストールアクション

- `metadata.openclaw.install` はインストールオプション（brew/node/go/uv）を定義します。
- アプリは `skills.install` を呼び出して、gateway host上でinstallerを実行します。
- 組み込みの危険コード `critical` findings は、デフォルトで `skills.install` をブロックします。疑わしいfindingは引き続き警告のみです。危険overrideはgateway request上には存在しますが、デフォルトのアプリフローはフェイルクローズのままです。
- すべてのインストールオプションが `download` なら、gatewayはすべてのdownload
  choiceを表示します。
- そうでない場合、gatewayは現在の
  install preferenceとホストバイナリを使って、好ましいinstallerを1つ選びます。`skills.install.preferBrew` が有効で `brew` が存在する場合はHomebrewを最優先し、その後 `uv`、次に
  `skills.install.nodeManager` で設定されたnode manager、その後に
  `go` や `download` などのfallbackが続きます。
- Node install labelは、`yarn` を含め、設定済みのnode managerを反映します。

## Env/API key

- アプリはキーを `~/.openclaw/openclaw.json` の `skills.entries.<skillKey>` 配下に保存します。
- `skills.update` は `enabled`, `apiKey`, `env` をpatchします。

## Remote mode

- install + config updateはローカルMacではなく、gateway host上で行われます。

## 関連

- [Skills](/ja-JP/tools/skills)
- [macOS app](/ja-JP/platforms/macos)

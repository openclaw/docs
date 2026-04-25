---
read_when:
    - あなたはOpenClaw Pluginを保守しています
    - Plugin互換性の警告が表示される
    - Plugin SDKまたはマニフェストの移行を計画している
summary: Plugin互換性コントラクト、廃止予定メタデータ、移行時の期待事項
title: Plugin互換性
x-i18n:
    generated_at: "2026-04-25T18:19:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 511bd12cff1e72a93091cbb1ac7d75377b0b9d2f016b55f4cdc77293f6172a00
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClawは、古いPluginコントラクトを削除する前に、名前付きの互換アダプターを通して接続したままにします。これにより、SDK、マニフェスト、セットアップ、設定、agentランタイムのコントラクトが進化しても、既存のバンドル済みPluginと外部Pluginが保護されます。

## 互換性レジストリ

Plugin互換性コントラクトは、コアレジストリ
`src/plugins/compat/registry.ts` で追跡されます。

各レコードには次が含まれます。

- 安定した互換性コード
- ステータス: `active`、`deprecated`、`removal-pending`、または `removed`
- owner: SDK、config、setup、channel、provider、plugin execution、agent runtime、
  または core
- 該当する場合は導入日と廃止予定日
- 置き換えガイダンス
- 古い動作と新しい動作をカバーする docs、diagnostics、tests

このレジストリは、メンテナーの計画と将来のplugin inspectorチェックのための情報源です。Plugin向け動作が変更される場合は、アダプターを追加する変更と同じ変更内で、互換性レコードを追加または更新してください。

## plugin inspector パッケージ

plugin inspector は、バージョン付きの互換性およびマニフェストコントラクトを基盤とする、コアOpenClawリポジトリ外の別パッケージ/別リポジトリとして存在すべきです。

初日のCLIは次のとおりです。

```sh
openclaw-plugin-inspector ./my-plugin
```

出力するべきもの:

- マニフェスト/schema 検証
- チェック対象のコントラクト互換性バージョン
- install/source メタデータチェック
- コールドパス import チェック
- 廃止予定および互換性の警告

CI annotation で安定した機械可読出力を得るには `--json` を使います。OpenClaw
coreは、inspectorが利用できるコントラクトとfixtureを公開すべきですが、
メインの `openclaw` パッケージから inspector バイナリを公開してはいけません。

## 廃止予定ポリシー

OpenClawは、置き換えを導入したのと同じリリースで、文書化されたPluginコントラクトを削除してはいけません。

移行シーケンスは次のとおりです。

1. 新しいコントラクトを追加する。
2. 古い動作を名前付き互換アダプター経由で接続したままにする。
3. Plugin作成者が対応できる時点で diagnostics または warnings を出す。
4. 置き換えとタイムラインを文書化する。
5. 古い経路と新しい経路の両方をテストする。
6. 告知した移行ウィンドウを待つ。
7. 明示的な破壊的リリース承認がある場合にのみ削除する。

廃止予定レコードには、warning開始日、置き換え、docsリンク、および既知であれば削除予定日を含める必要があります。

## 現在の互換性領域

現在の互換性レコードには次が含まれます。

- `openclaw/plugin-sdk/compat` のようなレガシーな広範SDK import
- レガシーなhook専用Plugin形状と `before_agent_start`
- バンドル済みPluginのallowlistおよび有効化動作
- レガシーなprovider/channel env-var マニフェストメタデータ
- マニフェストのcontribution ownership に置き換えられつつある activation hint
- public naming が `agentRuntime` に移行する間の、`embeddedHarness` と `agent-harness` の命名エイリアス
- レジストリ優先の `channelConfigs` メタデータが導入される間の、生成済みバンドルチャネル設定メタデータのフォールバック
- 永続化されたplugin registry disable env。これは、operator を
  `openclaw plugins registry --refresh` と `openclaw doctor --fix` へ移行する repair flow の期間中のものです

新しいPluginコードでは、レジストリおよび個別の移行ガイドに記載された置き換えを優先するべきです。既存のPluginは、docs、diagnostics、release notes が削除ウィンドウを告知するまでは、互換経路を使い続けることができます。

## リリースノート

リリースノートには、予定日と移行ドキュメントへのリンク付きで、今後のPlugin廃止予定を含めるべきです。その警告は、互換経路が `removal-pending` または `removed` に移る前に行う必要があります。

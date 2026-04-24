---
read_when:
    - mac WebChatビューまたはloopbackポートをデバッグする
summary: macアプリがGateway WebChatをどのように埋め込み、どうデバッグするか
title: WebChat（macOS）
x-i18n:
    generated_at: "2026-04-24T05:09:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

macOSのmenubarアプリは、WebChat UIをネイティブのSwiftUIビューとして埋め込みます。
Gatewayへ接続し、選択したagentの**main session** をデフォルトにします
（他のsession向けにはsession switcherあり）。

- **Local mode**: ローカルのGateway WebSocketへ直接接続します。
- **Remote mode**: Gateway control portをSSH経由でforwardし、その
  tunnelをdata planeとして使います。

## 起動とデバッグ

- 手動: Lobsterメニュー → 「Open Chat」。
- テスト用に自動で開く:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- ログ: `./scripts/clawlog.sh`（subsystem `ai.openclaw`, category `WebChatSwiftUI`）。

## 接続方法

- Data plane: Gateway WS methods `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` と events `chat`, `agent`, `presence`, `tick`, `health`。
- `chat.history` は表示正規化済みのtranscript rowを返します: インラインdirective
  tagは可視テキストから除去され、プレーンテキストのtool-call XML payload
  （`<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`、および切り詰められたtool-call blockを含む）と、
  漏洩したASCII/全角のmodel control tokenは除去され、正確に `NO_REPLY` / `no_reply` のような
  純粋なsilent-token assistant rowは省略され、サイズの大きすぎるrowはplaceholderに置き換えられることがあります。
- Session: デフォルトはprimary session（`main`、またはscopeが
  globalなら `global`）。UIではsessionを切り替えられます。
- Onboardingでは、初回セットアップを分離するため専用sessionを使います。

## セキュリティサーフェス

- Remote modeでは、SSH経由でforwardされるのはGateway WebSocket control portだけです。

## 既知の制限

- UIはchat session向けに最適化されており（完全なbrowser sandboxではありません）。

## 関連

- [WebChat](/ja-JP/web/webchat)
- [macOS app](/ja-JP/platforms/macos)

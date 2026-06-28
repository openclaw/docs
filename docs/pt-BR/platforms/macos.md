---
read_when:
    - Instalando o aplicativo para macOS
    - Decidindo entre o modo Gateway local e remoto no macOS
    - Procurando downloads de lançamento do app para macOS
summary: Instale e use o aplicativo de barra de menus do OpenClaw para macOS
title: aplicativo para macOS
x-i18n:
    generated_at: "2026-06-28T00:12:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

O app para macOS é o **companheiro de barra de menus** do OpenClaw. Use-o quando você quiser uma
UI nativa de bandeja, prompts de permissão do macOS, notificações, WebChat, entrada por voz,
Canvas ou ferramentas de nó hospedadas no Mac, como `system.run`.

Se você precisa apenas da CLI e do Gateway, comece com [Primeiros passos](/pt-BR/start/getting-started).

## Download

Baixe as builds do app para macOS nas
[releases do OpenClaw no GitHub](https://github.com/openclaw/openclaw/releases).
Quando uma release incluir assets do app para macOS, procure por:

- `OpenClaw-<version>.dmg` (preferido)
- `OpenClaw-<version>.zip`

Algumas releases incluem apenas CLI, evidências ou assets para Windows. Se a
release mais recente não tiver asset do app para macOS, use a release mais recente que tiver, ou compile o
app a partir do código-fonte com [configuração de desenvolvimento no macOS](/pt-BR/platforms/mac/dev-setup).

## Primeira execução

1. Instale e inicie **OpenClaw.app**.
2. Conclua a lista de permissões do macOS.
3. Escolha o modo **Local** ou **Remoto**.
4. Instale a CLI `openclaw` se o app solicitar.
5. Abra o WebChat pela barra de menus e envie uma mensagem de teste.

Para o caminho de configuração da CLI/Gateway, use [Primeiros passos](/pt-BR/start/getting-started).
Para recuperar permissões, use [permissões do macOS](/pt-BR/platforms/mac/permissions).

## Escolha um modo de Gateway

| Modo   | Use quando                                                                             | Página de detalhes                                        |
| ------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Local  | Este Mac deve executar o Gateway e mantê-lo ativo com launchd.                         | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway)        |
| Remoto | Outro host executa o Gateway e este Mac deve controlá-lo por SSH, LAN ou Tailnet.      | [Controle remoto](/pt-BR/platforms/mac/remote)                  |

O modo Local exige uma CLI `openclaw` instalada. O app pode instalá-la, ou você
pode seguir [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway).

## O que o app controla

- Status da barra de menus, notificações, integridade e WebChat.
- Prompts de permissão do macOS para tela, microfone, fala, automação e acessibilidade.
- Ferramentas de nó locais, como Canvas, captura de câmera/tela, notificações e `system.run`.
- Prompts de aprovação de execução para comandos hospedados no Mac.
- Túneis SSH em modo remoto ou conexões diretas ao Gateway.

O app **não** substitui o Gateway do OpenClaw nem a documentação geral da CLI. A
configuração principal do Gateway, provedores, plugins, canais, ferramentas e segurança ficam em
suas próprias documentações.

## Páginas detalhadas do macOS

| Tarefa                                  | Leia                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Instalar ou depurar o serviço CLI/Gateway | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway)                                          |
| Manter o estado fora de pastas sincronizadas com a nuvem | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| Depurar descoberta e conectividade do app | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| Entender o comportamento do launchd     | [Ciclo de vida do Gateway](/pt-BR/platforms/mac/child-process)                                    |
| Corrigir permissões ou problemas de assinatura/TCC | [permissões do macOS](/pt-BR/platforms/mac/permissions)                                           |
| Conectar-se a um Gateway remoto         | [Controle remoto](/pt-BR/platforms/mac/remote)                                                    |
| Ler o status da barra de menus e verificações de integridade | [Barra de menus](/pt-BR/platforms/mac/menu-bar), [Verificações de integridade](/pt-BR/platforms/mac/health) |
| Usar a UI de chat incorporada           | [WebChat](/pt-BR/platforms/mac/webchat)                                                           |
| Usar ativação por voz ou push-to-talk   | [Ativação por voz](/pt-BR/platforms/mac/voicewake)                                                |
| Usar Canvas e deep links do Canvas      | [Canvas](/pt-BR/platforms/mac/canvas)                                                             |
| Hospedar PeekabooBridge para automação de UI | [Ponte Peekaboo](/pt-BR/platforms/mac/peekaboo)                                                    |
| Configurar aprovações de comandos       | [Aprovações de execução](/pt-BR/tools/exec-approvals), [detalhes avançados](/pt-BR/tools/exec-approvals-advanced) |
| Inspecionar comandos de nó do Mac e IPC do app | [IPC do macOS](/pt-BR/platforms/mac/xpc)                                                          |
| Capturar logs                           | [registro em log do macOS](/pt-BR/platforms/mac/logging)                                         |
| Compilar a partir do código-fonte       | [configuração de desenvolvimento no macOS](/pt-BR/platforms/mac/dev-setup)                       |

## Relacionado

- [Plataformas](/pt-BR/platforms)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Gateway](/pt-BR/gateway)
- [Aprovações de execução](/pt-BR/tools/exec-approvals)

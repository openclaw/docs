---
read_when:
    - Instalando o aplicativo para macOS
    - Decidindo entre o modo Gateway local e remoto no macOS
    - Procurando downloads de lançamento do app para macOS
summary: Instale e use o app de barra de menus do OpenClaw para macOS
title: app para macOS
x-i18n:
    generated_at: "2026-07-04T06:25:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

O app para macOS é o **companheiro da barra de menus** do OpenClaw. Use-o quando quiser uma
IU nativa na bandeja, prompts de permissão do macOS, notificações, WebChat, entrada por voz,
Canvas ou ferramentas de nó hospedadas no Mac, como `system.run`.

Se você só precisa da CLI e do Gateway, comece com [Primeiros passos](/pt-BR/start/getting-started).

## Download

Baixe builds do app para macOS nas
[releases do OpenClaw no GitHub](https://github.com/openclaw/openclaw/releases).
Quando uma release incluir ativos do app para macOS, procure por:

- `OpenClaw-<version>.dmg` (preferencial)
- `OpenClaw-<version>.zip`

Algumas releases incluem apenas CLI, evidências ou ativos para Windows. Se a release
mais recente não tiver nenhum ativo do app para macOS, use a release mais recente que tenha, ou compile o
app a partir do código-fonte com [configuração de desenvolvimento no macOS](/pt-BR/platforms/mac/dev-setup).

## Primeira execução

1. Instale e inicie o **OpenClaw.app**.
2. Escolha **Este Mac** para um Gateway local, ou conecte-se a um Gateway remoto.
3. No modo local, aguarde enquanto o app instala seu runtime em espaço de usuário e o Gateway.
4. Conclua a configuração do provedor e a lista de verificação de permissões do macOS.
5. Envie a mensagem de teste de integração.

Para o caminho de configuração da CLI/Gateway, use [Primeiros passos](/pt-BR/start/getting-started).
Para recuperação de permissões, use [permissões do macOS](/pt-BR/platforms/mac/permissions).

## Escolha um modo de Gateway

| Modo   | Use quando                                                                              | Página de detalhes                                  |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Local  | Este Mac deve executar o Gateway e mantê-lo ativo com launchd.                          | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway) |
| Remoto | Outro host executa o Gateway e este Mac deve controlá-lo por SSH, LAN ou Tailnet.       | [Controle remoto](/pt-BR/platforms/mac/remote)           |

O modo local exige uma CLI `openclaw` instalada. Em um Mac novo, o app instala
automaticamente a CLI e o runtime correspondentes antes de iniciar o assistente do Gateway.
Consulte [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway) para recuperação manual.

## O que o app controla

- Status da barra de menus, notificações, integridade e WebChat.
- Prompts de permissão do macOS para tela, microfone, fala, automação e acessibilidade.
- Ferramentas de nó locais, como Canvas, captura de câmera/tela, notificações e `system.run`.
- Prompts de aprovação de execução para comandos hospedados no Mac.
- Túneis SSH em modo remoto ou conexões diretas ao Gateway.

O app **não** substitui a documentação do Gateway do OpenClaw nem da CLI geral. A configuração
central do Gateway, provedores, plugins, canais, ferramentas e segurança ficam em
suas próprias documentações.

## Páginas de detalhes do macOS

| Tarefa                                   | Leia                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Instalar ou depurar o serviço CLI/Gateway | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway)                                         |
| Manter o estado fora de pastas sincronizadas na nuvem | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway#state-directory-on-macos)       |
| Depurar descoberta e conectividade do app | [Gateway no macOS](/pt-BR/platforms/mac/bundled-gateway#debug-app-connectivity)                  |
| Entender o comportamento do launchd       | [Ciclo de vida do Gateway](/pt-BR/platforms/mac/child-process)                                   |
| Corrigir permissões ou problemas de assinatura/TCC | [Permissões do macOS](/pt-BR/platforms/mac/permissions)                                  |
| Conectar-se a um Gateway remoto           | [Controle remoto](/pt-BR/platforms/mac/remote)                                                   |
| Ler status da barra de menus e verificações de integridade | [Barra de menus](/pt-BR/platforms/mac/menu-bar), [Verificações de integridade](/pt-BR/platforms/mac/health) |
| Usar a IU de chat incorporada             | [WebChat](/pt-BR/platforms/mac/webchat)                                                          |
| Usar ativação por voz ou pressionar para falar | [Ativação por voz](/pt-BR/platforms/mac/voicewake)                                           |
| Usar Canvas e deep links do Canvas        | [Canvas](/pt-BR/platforms/mac/canvas)                                                            |
| Hospedar PeekabooBridge para automação de IU | [Ponte Peekaboo](/pt-BR/platforms/mac/peekaboo)                                              |
| Configurar aprovações de comandos         | [Aprovações de execução](/pt-BR/tools/exec-approvals), [detalhes avançados](/pt-BR/tools/exec-approvals-advanced) |
| Inspecionar comandos de nó do Mac e IPC do app | [IPC do macOS](/pt-BR/platforms/mac/xpc)                                                     |
| Capturar logs                             | [Logs do macOS](/pt-BR/platforms/mac/logging)                                                     |
| Compilar a partir do código-fonte         | [Configuração de desenvolvimento no macOS](/pt-BR/platforms/mac/dev-setup)                       |

## Relacionados

- [Plataformas](/pt-BR/platforms)
- [Primeiros passos](/pt-BR/start/getting-started)
- [Gateway](/pt-BR/gateway)
- [Aprovações de execução](/pt-BR/tools/exec-approvals)

---
read_when:
    - Depuração da visualização do WebChat no Mac ou da porta de local loopback
summary: Como o aplicativo para Mac incorpora o WebChat do Gateway e como depurá-lo
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T00:07:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

O aplicativo da barra de menus do macOS incorpora a interface do WebChat como uma visualização SwiftUI nativa. Ele se conecta ao Gateway e usa por padrão a sessão principal do agente selecionado (`main` ou `global` quando `session.scope` é `global`).

A janela completa do chat é uma visualização dividida nativa:

- **Barra lateral de sessões**: lista pesquisável de sessões com seções de itens fixados e recentes, indicadores de mensagens não lidas e menus de contexto para fixar/desafixar, copiar a chave da sessão e excluir. Um botão na barra de ferramentas (ou Cmd-N) cria uma nova sessão real por meio de `sessions.create`.
- **Barra de ferramentas da janela**: indicador circular de uso do contexto (tokens e custo da sessão, com uma ação compacta), seletor de nível de raciocínio, seletor de modelo e menu de ações da sessão (nova sessão, atualizar, copiar chave da sessão, exportar transcrição, compactar, limpar histórico).
- **Transcrição e campo de composição**: as mensagens do assistente são renderizadas como texto simples com um avatar, e as mensagens do usuário, como balões na cor de destaque. Digitar `/` abre o preenchimento automático de comandos com barra, fornecido por `commands.list`, com navegação pelo teclado usando as teclas de seta/Tab/Return/Escape. Clique com o botão direito em uma mensagem para copiá-la.

O painel de chat rápido ancorado à barra de menus mantém o layout compacto de coluna única com seletores embutidos.

- **Modo local**: conecta-se diretamente ao WebSocket do Gateway local.
- **Modo remoto**: encaminha a porta de controle do Gateway por SSH e usa esse túnel como plano de dados.

## Inicialização e depuração

- Manual: menu Lobster -> "Open Chat".
- Abertura automática para testes:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` é aceito como um alias legado.)

- Logs: `./scripts/clawlog.sh` (subsistema `ai.openclaw`, categoria `WebChatSwiftUI`).

## Como está conectado

- Plano de dados: métodos WS do Gateway `chat.history`, `chat.send`, `chat.abort`, `chat.inject` e eventos `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` retorna uma transcrição normalizada para exibição: as tags de diretivas embutidas são removidas do texto visível; as cargas XML de chamadas de ferramentas em texto simples (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluindo blocos truncados) e os tokens de controle do modelo que tenham vazado são removidos; as linhas do assistente que contenham apenas tokens de silêncio, como exatamente `NO_REPLY`/`no_reply`, são omitidas; e linhas grandes demais podem ser substituídas por um marcador truncado.
- Sessão: usa por padrão a sessão principal, conforme descrito acima; a interface pode alternar entre sessões.
- A integração inicial usa uma sessão dedicada para manter a configuração da primeira execução separada.
- Cache offline: o aplicativo mantém um pequeno cache somente leitura das sessões de chat e transcrições recentes por Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): em inicializações a frio, a última transcrição conhecida é exibida imediatamente e atualizada assim que o Gateway responde, e os chats recentes continuam acessíveis para consulta enquanto não há conexão (o envio permanece desativado até que a conexão seja restabelecida).

## Superfície de segurança

- O modo remoto encaminha por SSH somente a porta de controle do WebSocket do Gateway.

## Limitações conhecidas

- A interface é otimizada para sessões de chat, não para um ambiente isolado completo de navegador.

## Conteúdo relacionado

- [WebChat](/pt-BR/web/webchat)
- [Aplicativo para macOS](/pt-BR/platforms/macos)

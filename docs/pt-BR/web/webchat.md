---
read_when:
    - Depurando ou configurando o acesso ao WebChat
summary: Host estático do WebChat em loopback e uso de WS do Gateway para a interface de chat
title: WebChat
x-i18n:
    generated_at: "2026-06-27T18:21:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

Status: a UI de chat SwiftUI para macOS/iOS fala diretamente com o WebSocket do Gateway.

## O que é

- Uma UI de chat nativa para o Gateway (sem navegador incorporado e sem servidor estático local).
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: as respostas sempre voltam para o WebChat.

## Início rápido

1. Inicie o Gateway.
2. Abra a UI do WebChat (app macOS/iOS) ou a aba de chat da Control UI.
3. Garanta que um caminho de autenticação válido do Gateway esteja configurado (segredo compartilhado por padrão,
   mesmo em loopback).

## Como funciona (comportamento)

- A UI se conecta ao WebSocket do Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é limitado para estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas grandes demais por `[chat.history omitted: message too large]`.
- Quando uma mensagem visível do assistente foi truncada em `chat.history`, a Control UI pode abrir um leitor lateral e buscar a entrada completa normalizada para exibição sob demanda por meio de `chat.message.get`, sem aumentar o payload padrão do histórico.
- `chat.history` segue o ramo ativo da transcrição para arquivos de sessão append-only modernos, portanto ramos de reescrita abandonados e cópias de prompts substituídas não são renderizados no WebChat.
- Entradas de Compaction são renderizadas como um divisor explícito de histórico compactado. O divisor explica que a transcrição compactada é preservada como um ponto de verificação e aponta para os controles de ponto de verificação de Sessões, onde operadores podem criar ramificações ou restaurar a partir dessa visualização compactada quando suas permissões permitirem.
- A Control UI lembra o `sessionId` do Gateway subjacente retornado por `chat.history` e o inclui em chamadas `chat.send` subsequentes, portanto reconexões e atualizações de página continuam a mesma conversa armazenada, a menos que o usuário inicie ou redefina uma sessão.
- A Control UI agrupa envios duplicados em andamento para a mesma sessão, mensagem e anexos antes de gerar um novo id de execução de `chat.send`; o Gateway ainda desduplica solicitações repetidas que reutilizam a mesma chave de idempotência.
- Arquivos de inicialização do workspace e instruções pendentes de `BOOTSTRAP.md` são fornecidos por meio do Project Context do prompt do sistema do agente, não copiados para a mensagem de usuário do WebChat. A truncagem do bootstrap adiciona apenas um aviso conciso de recuperação no prompt do sistema; contagens detalhadas e ajustes de configuração permanecem nas superfícies de diagnóstico.
- `chat.history` também é normalizado para exibição: contexto do OpenClaw apenas de runtime,
  wrappers de envelope de entrada, tags de diretiva de entrega inline
  como `[[reply_to_*]]` e `[[audio_as_voice]]`, payloads XML de chamadas de ferramenta em texto simples
  (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), e
  tokens de controle de modelo ASCII/largura total vazados são removidos do texto visível,
  e entradas do assistente cujo texto visível inteiro é apenas o token silencioso exato
  `NO_REPLY` / `no_reply` são omitidas.
- Payloads de resposta marcados como raciocínio (`isReasoning: true`) são excluídos do conteúdo do assistente do WebChat, do texto de replay da transcrição e dos blocos de conteúdo de áudio, para que payloads apenas de pensamento não apareçam como mensagens visíveis do assistente nem como áudio reproduzível.
- `chat.inject` acrescenta uma nota do assistente diretamente à transcrição e a transmite para a UI (sem execução de agente).
- Execuções abortadas podem manter saída parcial do assistente visível na UI.
- O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando há saída em buffer, e marca essas entradas com metadados de aborto.
- O histórico é sempre buscado no Gateway (sem observação de arquivos locais).
- Se o Gateway estiver inacessível, o WebChat fica somente leitura.

### Modelo de transcrição e entrega

O WebChat tem dois caminhos de dados separados:

- O arquivo JSONL da sessão é a transcrição durável do modelo/runtime. Para execuções normais de agente, o runtime OpenClaw incorporado persiste mensagens `user`, `assistant` e `toolResult` visíveis ao modelo por meio de seu gerenciador de sessão. O WebChat não grava texto arbitrário de entrega, status ou auxiliar nessa transcrição.
- Eventos `ReplyPayload` do Gateway são a projeção de entrega ao vivo. Eles podem ser normalizados para exibição no WebChat/canal, streaming de blocos, tags de diretiva, incorporação de mídia, flags de TTS/áudio e comportamento de fallback da UI. Eles próprios não são o log canônico da sessão.
- Harnesses que exigem respostas visíveis por meio de `tools.message` ainda usam o WebChat como um destino interno de resposta da execução atual. Um `message.send` sem destino dessa execução ativa do WebChat é projetado no mesmo chat e espelhado para a transcrição da sessão; o WebChat não se torna um canal de saída reutilizável e nunca herda `lastChannel`.
- O WebChat injeta entradas de transcrição do assistente apenas quando o Gateway é dono de uma mensagem exibida fora de uma rodada normal de agente incorporado: `chat.inject`, respostas de comandos sem agente, saída parcial abortada e suplementos de transcrição de mídia gerenciados pelo WebChat.
- `chat.history` lê a transcrição de sessão armazenada e aplica a projeção de exibição do WebChat. Se texto ao vivo do assistente aparecer durante uma execução, mas desaparecer após recarregar o histórico, primeiro verifique se o JSONL bruto contém o texto do assistente, depois se a projeção de `chat.history` o removeu, e então se a mesclagem otimista de cauda da Control UI substituiu o estado de entrega local pelo snapshot persistido.
- `chat.message.get` usa o mesmo ramo de transcrição e as mesmas regras de projeção de exibição que `chat.history`, incluindo escopo de agente ativo, mas mira uma entrada de transcrição por `messageId` e retorna um motivo honesto de indisponibilidade quando o conteúdo completo não pode mais ser retornado.

Respostas finais de execuções normais de agente devem ser duráveis porque o runtime incorporado grava o `message_end` do assistente. Qualquer fallback que espelhe um payload final entregue para a transcrição deve primeiro evitar duplicar uma rodada do assistente que o runtime incorporado já gravou.

## Painel de ferramentas dos agentes da Control UI

- O painel Ferramentas de `/agents` da Control UI tem duas visualizações separadas:
  - **Disponível agora** usa `tools.effective(sessionKey=...)` e mostra uma projeção
    somente leitura derivada do servidor do inventário da sessão atual, incluindo ferramentas principais, de Plugin, pertencentes a canais
    e de servidores MCP já descobertos.
  - **Configuração de ferramentas** usa `tools.catalog` e permanece focada em perfis, substituições e
    semântica do catálogo.
- A disponibilidade em runtime é escopada por sessão. Trocar sessões no mesmo agente pode alterar a lista
  **Disponível agora**. Se servidores MCP configurados não tiverem sido conectados ou tiverem sido alterados
  desde a última descoberta, o painel mostra um aviso em vez de iniciar silenciosamente transportes MCP
  a partir do caminho de leitura.
- O editor de configuração não implica disponibilidade em runtime; o acesso efetivo ainda segue a precedência de políticas
  (`allow`/`deny`, substituições por agente e por provedor/canal).

## Uso remoto

- O modo remoto tunela o WebSocket do Gateway por SSH/Tailscale.
- Você não precisa executar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

O WebChat não tem seção de configuração persistida. O Gateway usa o limite de exibição incorporado de `chat.history`; clientes de API podem enviar `maxChars` por solicitação para sobrescrevê-lo em uma única chamada `chat.history`. A configuração legada `channels.webchat` e `gateway.webchat` foi aposentada; execute `openclaw doctor --fix` para removê-la.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta do WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticação WebSocket por segredo compartilhado.
- `gateway.auth.allowTailscale`: a aba de chat da Control UI no navegador pode usar cabeçalhos de identidade do Tailscale
  Serve quando habilitada.
- `gateway.auth.mode: "trusted-proxy"`: autenticação de proxy reverso para clientes de navegador atrás de uma origem de proxy **não loopback** com reconhecimento de identidade (veja [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino remoto do Gateway.
- `session.*`: armazenamento de sessão e padrões da chave principal.

## Relacionado

- [Control UI](/pt-BR/web/control-ui)
- [Dashboard](/pt-BR/web/dashboard)

---
read_when:
    - Depuração ou configuração do acesso ao WebChat
summary: Host estático de WebChat em loopback e uso de WS do Gateway para a interface de chat
title: Chat Web
x-i18n:
    generated_at: "2026-05-04T05:56:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Status: a UI de chat SwiftUI para macOS/iOS fala diretamente com o WebSocket do Gateway.

## O que é

- Uma UI de chat nativa para o gateway (sem navegador incorporado e sem servidor estático local).
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: as respostas sempre voltam para o WebChat.

## Início rápido

1. Inicie o gateway.
2. Abra a UI do WebChat (app macOS/iOS) ou a aba de chat da UI de Controle.
3. Garanta que um caminho de autenticação válido do gateway esteja configurado (shared-secret por padrão,
   mesmo em loopback).

## Como funciona (comportamento)

- A UI se conecta ao WebSocket do Gateway e usa `chat.history`, `chat.send` e `chat.inject`.
- `chat.history` é limitado para estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas grandes demais por `[chat.history omitted: message too large]`.
- `chat.history` segue o ramo de transcrição ativo para arquivos de sessão modernos somente de acréscimo, portanto ramos de reescrita abandonados e cópias de prompts substituídas não são renderizados no WebChat.
- Entradas de Compaction são renderizadas como um divisor explícito de histórico compactado. O divisor explica que turnos anteriores são preservados em um checkpoint e vincula aos controles de checkpoint de Sessões, onde operadores podem ramificar ou restaurar a visualização pré-Compaction quando suas permissões permitem.
- A UI de Controle lembra o `sessionId` de Gateway subjacente retornado por `chat.history` e o inclui em chamadas `chat.send` de acompanhamento, portanto reconexões e atualizações de página continuam a mesma conversa armazenada, a menos que o usuário inicie ou redefina uma sessão.
- A UI de Controle combina envios duplicados em andamento para a mesma sessão, mensagem e anexos antes de gerar um novo id de execução de `chat.send`; o Gateway ainda desduplica solicitações repetidas que reutilizam a mesma chave de idempotência.
- Arquivos de inicialização do workspace e instruções `BOOTSTRAP.md` pendentes são fornecidos pelo Contexto do Projeto do prompt de sistema do agente, não copiados para a mensagem de usuário do WebChat. O truncamento de bootstrap só adiciona um aviso conciso de recuperação no prompt de sistema; contagens detalhadas e opções de configuração ficam nas superfícies de diagnóstico.
- `chat.history` também é normalizado para exibição: contexto OpenClaw somente de runtime,
  wrappers de envelope de entrada, tags de diretiva de entrega inline
  como `[[reply_to_*]]` e `[[audio_as_voice]]`, payloads XML de chamada de ferramenta em texto simples
  (incluindo `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` e blocos de chamada de ferramenta truncados), e
  tokens de controle de modelo ASCII/largura total vazados são removidos do texto visível,
  e entradas do assistente cujo texto visível inteiro é apenas o token silencioso exato
  `NO_REPLY` / `no_reply` são omitidas.
- Payloads de resposta marcados como raciocínio (`isReasoning: true`) são excluídos do conteúdo do assistente do WebChat, do texto de repetição da transcrição e dos blocos de conteúdo de áudio, portanto payloads apenas de pensamento não aparecem como mensagens visíveis do assistente nem como áudio reproduzível.
- `chat.inject` acrescenta uma nota do assistente diretamente à transcrição e a transmite para a UI (sem execução de agente).
- Execuções abortadas podem manter a saída parcial do assistente visível na UI.
- O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando existe saída em buffer, e marca essas entradas com metadados de aborto.
- O histórico é sempre buscado no gateway (sem monitoramento de arquivo local).
- Se o gateway estiver inacessível, o WebChat fica somente leitura.

### Modelo de transcrição e entrega

O WebChat tem dois caminhos de dados separados:

- O arquivo JSONL da sessão é a transcrição durável do modelo/runtime. Para execuções normais de agente, o Pi persiste mensagens `user`, `assistant` e `toolResult` visíveis ao modelo por meio do seu gerenciador de sessões. O WebChat não grava texto arbitrário de entrega, status ou auxiliar nessa transcrição.
- Eventos `ReplyPayload` do Gateway são a projeção de entrega ao vivo. Eles podem ser normalizados para exibição no WebChat/canal, streaming de blocos, tags de diretiva, incorporação de mídia, flags de TTS/áudio e comportamento de fallback da UI. Eles não são, por si só, o log canônico da sessão.
- O WebChat injeta entradas de transcrição do assistente somente quando o Gateway possui uma mensagem exibida fora de um turno normal do assistente do Pi: `chat.inject`, respostas de comando sem agente, saída parcial abortada e suplementos de transcrição de mídia gerenciados pelo WebChat.
- `chat.history` lê a transcrição da sessão armazenada e aplica a projeção de exibição do WebChat. Se texto do assistente ao vivo aparecer durante uma execução, mas desaparecer após recarregar o histórico, verifique primeiro se o JSONL bruto contém o texto do assistente, depois se a projeção de `chat.history` o removeu, e então se a mesclagem de cauda otimista da UI de Controle substituiu o estado de entrega local pelo snapshot persistido.

Respostas finais de execuções normais de agente devem ser duráveis porque o Pi grava o `message_end` do assistente. Qualquer fallback que espelhe um payload final entregue na transcrição deve primeiro evitar duplicar um turno do assistente que o Pi já gravou.

## Painel de ferramentas de agentes da UI de Controle

- O painel Tools da UI de Controle em `/agents` tem duas visualizações separadas:
  - **Disponível Agora** usa `tools.effective(sessionKey=...)` e mostra o que a sessão atual
    pode realmente usar em runtime, incluindo ferramentas do núcleo, de Plugin e pertencentes ao canal.
  - **Configuração de Ferramentas** usa `tools.catalog` e permanece focado em perfis, substituições e
    semântica do catálogo.
- A disponibilidade de runtime tem escopo de sessão. Trocar sessões no mesmo agente pode alterar a lista
  **Disponível Agora**.
- O editor de configuração não implica disponibilidade em runtime; o acesso efetivo ainda segue a precedência de política
  (`allow`/`deny`, substituições por agente e por provedor/canal).

## Uso remoto

- O modo remoto encapsula o WebSocket do gateway por SSH/Tailscale.
- Você não precisa executar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do WebChat:

- `gateway.webchat.chatHistoryMaxChars`: contagem máxima de caracteres para campos de texto em respostas `chat.history`. Quando uma entrada de transcrição excede esse limite, o Gateway trunca campos de texto longos e pode substituir mensagens grandes demais por um placeholder. `maxChars` por solicitação também pode ser enviado pelo cliente para substituir esse padrão em uma única chamada `chat.history`.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta do WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticação WebSocket shared-secret.
- `gateway.auth.allowTailscale`: a aba de chat da UI de Controle no navegador pode usar cabeçalhos de identidade do Tailscale
  Serve quando habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticação por proxy reverso para clientes de navegador atrás de uma origem de proxy **não loopback** com reconhecimento de identidade (consulte [Autenticação de Proxy Confiável](/pt-BR/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: alvo do gateway remoto.
- `session.*`: armazenamento de sessão e padrões de chave principal.

## Relacionado

- [UI de Controle](/pt-BR/web/control-ui)
- [Painel](/pt-BR/web/dashboard)

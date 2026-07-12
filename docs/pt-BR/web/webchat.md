---
read_when:
    - Depuração ou configuração do acesso ao WebChat
summary: Host estático do WebChat em loopback e uso do WS do Gateway para a interface de chat
title: WebChat
x-i18n:
    generated_at: "2026-07-12T15:45:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

Status: a interface de chat SwiftUI do macOS/iOS se comunica diretamente com o WebSocket do Gateway. Sem navegador incorporado, sem servidor estático local.

## O que é

- Uma interface de chat nativa para o Gateway.
- Usa as mesmas sessões e regras de roteamento que outros canais.
- Roteamento determinístico: as respostas sempre retornam ao WebChat.
- O histórico é sempre obtido do Gateway (sem monitoramento de arquivos locais). Se o Gateway estiver inacessível, o WebChat ficará no modo somente leitura.

## Início rápido

1. Inicie o Gateway.
2. Abra a interface do WebChat (aplicativo para macOS/iOS) ou a guia de chat da interface de controle.
3. Verifique se um caminho de autenticação válido do Gateway está configurado (segredo compartilhado por padrão, mesmo em loopback).

## Como funciona

- A interface se conecta ao WebSocket do Gateway e usa os métodos RPC `chat.history`, `chat.send`, `chat.inject` e `chat.message.get`.
- `chat.history` é limitado para garantir estabilidade: o Gateway pode truncar campos de texto longos, omitir metadados pesados e substituir entradas grandes demais por `[chat.history omitted: message too large]`. Os clientes da API podem enviar um `maxChars` por solicitação para substituir o limite padrão em uma chamada.
- Quando uma mensagem visível do assistente é truncada em `chat.history`, a interface de controle pode abrir um leitor lateral e buscar sob demanda a entrada completa normalizada para exibição por meio de `chat.message.get`, sem aumentar a carga útil padrão do histórico. `chat.message.get` usa a mesma ramificação de transcrição e as mesmas regras de exibição que `chat.history`, mas direciona uma entrada por `messageId` e retorna um motivo verdadeiro de indisponibilidade quando o conteúdo completo não pode mais ser retornado.
- `chat.history` segue a ramificação ativa da transcrição para arquivos de sessão somente de acréscimo, portanto, ramificações de reescrita abandonadas e cópias de prompts substituídas não são renderizadas no WebChat.
- As entradas de Compaction são renderizadas como um divisor "Histórico compactado", explicando que a transcrição compactada é preservada como um ponto de verificação, com uma ação para abrir os pontos de verificação da sessão (criar uma ramificação ou restaurar, quando as permissões permitirem).
- A interface de controle memoriza o `sessionId` do Gateway subjacente retornado por `chat.history` e o inclui nas chamadas subsequentes de `chat.send`, portanto, reconexões e atualizações da página continuam a mesma conversa armazenada, a menos que o usuário inicie ou redefina uma sessão.
- `chat.send` recebe uma chave de idempotência (a interface de controle usa o ID da execução); o Gateway elimina solicitações repetidas que reutilizam a mesma chave, portanto, reenvios ou envios duplicados em andamento para a mesma sessão/mensagem/anexos não criam uma segunda execução.
- Os arquivos de inicialização do espaço de trabalho e as instruções pendentes de `BOOTSTRAP.md` são fornecidos pela seção `# Project Context` do prompt de sistema do agente, e não copiados para a mensagem do usuário no WebChat. Se o conteúdo de bootstrap for truncado, o prompt de sistema receberá uma breve "Notificação de contexto de bootstrap"; contagens detalhadas e opções de configuração permanecem nas superfícies de diagnóstico.
- A normalização de exibição em `chat.history` remove: o contexto do OpenClaw exclusivo do runtime, wrappers de envelope de entrada, tags de diretivas de entrega em linha, como `[[reply_to_current]]`, `[[reply_to:<id>]]` e `[[audio_as_voice]]`, cargas úteis XML de chamadas de ferramentas em texto simples (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, incluindo blocos truncados) e tokens de controle do modelo ASCII/de largura completa que tenham vazado. Entradas do assistente cujo texto visível completo seja apenas o token silencioso `NO_REPLY` (sem diferenciar maiúsculas de minúsculas) são omitidas.
- Cargas úteis de resposta sinalizadas como raciocínio (`isReasoning: true`) são excluídas do conteúdo do assistente no WebChat, do texto de reprodução da transcrição e dos blocos de conteúdo de áudio, para que cargas úteis exclusivas de raciocínio não apareçam como mensagens visíveis do assistente nem como áudio reproduzível.
- `chat.inject` acrescenta uma nota do assistente diretamente à transcrição e a transmite para a interface (sem execução do agente).
- Execuções interrompidas podem manter a saída parcial do assistente visível na interface. O Gateway persiste esse texto parcial no histórico da transcrição quando há saída armazenada em buffer e marca a entrada com metadados de interrupção.

### Modelo de transcrição e entrega

O WebChat tem dois caminhos de dados separados:

- As linhas da transcrição no SQLite são a transcrição durável do modelo/runtime. Para execuções normais do agente, o runtime incorporado do OpenClaw persiste as mensagens `user`, `assistant` e `toolResult` visíveis ao modelo por meio do acessador de sessão. O WebChat não grava textos arbitrários de entrega, status ou auxiliares nessa transcrição.
- Os eventos `ReplyPayload` do Gateway são a projeção de entrega em tempo real: normalizada para exibição no WebChat/canal, streaming de blocos, tags de diretivas, incorporação de mídia, sinalizadores de TTS/áudio e comportamento de fallback da interface. Eles próprios não são o registro canônico da sessão.
- Harnesses que exigem respostas visíveis por meio de `tools.message` ainda usam o WebChat como destino interno de resposta da execução atual. Um `message.send` sem destino dessa execução ativa do WebChat é projetado no mesmo chat e espelhado na transcrição da sessão; o WebChat não se torna um canal de saída reutilizável e nunca herda `lastChannel`.
- O WebChat injeta entradas de transcrição do assistente somente quando o Gateway controla uma mensagem exibida fora de um turno normal do agente incorporado: `chat.inject`, respostas a comandos que não são do agente, saída parcial interrompida e complementos de transcrição de mídia gerenciados pelo WebChat.
- Se o texto do assistente em tempo real aparecer durante uma execução, mas desaparecer após o recarregamento do histórico, verifique nesta ordem: se a transcrição do SQLite contém o texto do assistente, se a projeção de exibição de `chat.history` o removeu e, em seguida, se a mesclagem otimista da cauda da interface de controle substituiu o estado de entrega local pelo snapshot persistido.

As respostas finais de execuções normais do agente devem ser duráveis porque o runtime incorporado grava o `message_end` do assistente. Qualquer fallback que espelhe uma carga útil final entregue na transcrição deve primeiro evitar duplicar um turno do assistente que o runtime incorporado já gravou.

## Painel de ferramentas dos agentes da interface de controle

- O painel Tools de `/agents` da interface de controle tem uma visualização "Available Right Now" baseada em `tools.effective(sessionKey=...)`: uma projeção somente leitura derivada do servidor do inventário de ferramentas da sessão atual, incluindo ferramentas principais, de plugins, pertencentes a canais e de servidores MCP já descobertas.
- Uma visualização separada de edição de configuração (baseada em `tools.catalog`) abrange perfis, substituições por agente e semântica do catálogo.
- A disponibilidade do runtime é limitada à sessão. Alternar entre sessões do mesmo agente pode alterar a lista "Available Right Now". Se os servidores MCP configurados não tiverem sido conectados ou tiverem sido alterados desde a última descoberta, o painel exibirá uma notificação em vez de iniciar silenciosamente transportes MCP pelo caminho de leitura.
- O editor de configuração não implica disponibilidade no runtime; o acesso efetivo ainda segue a precedência das políticas (`allow`/`deny`, substituições por agente e por provedor/canal).

## Uso remoto

- O modo remoto cria um túnel para o WebSocket do Gateway por SSH/Tailscale.
- Não é necessário executar um servidor WebChat separado.

## Referência de configuração (WebChat)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

O WebChat não tem uma seção de configuração persistida. O Gateway usa o limite de exibição integrado de `chat.history`; clientes da API podem enviar um `maxChars` por solicitação para substituí-lo em uma única chamada. As configurações legadas `channels.webchat` e `gateway.webchat` foram descontinuadas; execute `openclaw doctor --fix` para removê-las.

Opções globais relacionadas:

- `gateway.port`, `gateway.bind`: host/porta do WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticação do WebSocket por segredo compartilhado.
- `gateway.auth.allowTailscale`: a guia de chat da interface de controle no navegador pode usar os cabeçalhos de identidade do Tailscale
  Serve quando habilitada.
- `gateway.auth.mode: "trusted-proxy"`: autenticação por proxy reverso para clientes de navegador atrás de uma origem de proxy **não loopback** ciente de identidade (consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino remoto do Gateway.
- `session.*`: armazenamento de sessões e padrões da chave principal.

## Relacionado

- [Interface de controle](/pt-BR/web/control-ui)
- [Painel](/pt-BR/web/dashboard)

---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso à Tailnet sem túneis SSH
sidebarTitle: Control UI
summary: Interface de controle baseada no navegador para o Gateway (chat, atividade, nós, configuração)
title: UI de Controle
x-i18n:
    generated_at: "2026-07-02T00:47:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
    source_path: web/control-ui.md
    workflow: 16
---

A Control UI é um pequeno app de página única **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie o Gateway primeiro: `openclaw gateway`.

<Note>
Em associações de LAN nativas do Windows, o Firewall do Windows ou a Política de Grupo gerenciada pela organização ainda pode bloquear a URL de LAN anunciada mesmo quando `127.0.0.1` funciona no host do Gateway. Execute `openclaw gateway status --deep` no host Windows; ele relata portas provavelmente bloqueadas, incompatibilidades de perfil e regras de firewall locais que a política pode ignorar.
</Note>

A autenticação é fornecida durante o handshake do WebSocket por meio de:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão da aba atual do navegador e a URL do gateway selecionada; senhas não são persistidas. O onboarding normalmente gera um token de gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à Control UI a partir de um novo navegador ou dispositivo, o Gateway normalmente exige uma **aprovação de pareamento única**. Esta é uma medida de segurança para impedir acesso não autorizado.

**O que você verá:** "desconectado (1008): pareamento obrigatório"

<Steps>
  <Step title="Listar solicitações pendentes">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Aprovar por ID da solicitação">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Se o navegador tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute novamente `openclaw devices list` antes da aprovação.

Se o navegador já estiver pareado e você alterá-lo de acesso de leitura para acesso de escrita/admin, isso será tratado como uma atualização de aprovação, não como uma reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão mais ampla e solicita que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte [CLI de dispositivos](/pt-BR/cli/devices) para rotação e revogação de tokens.

Agentes Paperclip que se conectam por meio do adaptador `openclaw_gateway` usam o mesmo fluxo de aprovação da primeira execução. Após a tentativa de conexão inicial, execute `openclaw devices approve --latest` para visualizar a solicitação pendente e, em seguida, execute novamente o comando `openclaw devices approve <requestId>` impresso para aprová-la. Passe valores explícitos de `--url` e `--token` para um gateway remoto. Para manter aprovações estáveis entre reinicializações, configure um `adapterConfig.devicePrivateKeyPem` persistente no Paperclip em vez de deixá-lo gerar uma nova identidade de dispositivo efêmera a cada execução.

<Note>
- Conexões diretas de navegador por local loopback (`127.0.0.1` / `localhost`) são aprovadas automaticamente.
- O Tailscale Serve pode ignorar a ida e volta de pareamento para sessões de operador da Control UI quando `gateway.auth.allowTailscale: true`, a identidade do Tailscale é verificada e o navegador apresenta sua identidade de dispositivo.
- Associações diretas de Tailnet, conexões de navegador por LAN e perfis de navegador sem identidade de dispositivo ainda exigem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo exclusivo, portanto trocar de navegador ou limpar os dados do navegador exigirá novo pareamento.

</Note>

## Identidade pessoal (local do navegador)

A Control UI oferece suporte a uma identidade pessoal por navegador (nome de exibição e avatar) anexada às mensagens de saída para atribuição em sessões compartilhadas. Ela fica no armazenamento do navegador, é limitada ao perfil atual do navegador e não é sincronizada com outros dispositivos nem persistida no lado do servidor além dos metadados normais de autoria da transcrição nas mensagens que você de fato envia. Limpar os dados do site ou trocar de navegador a redefine como vazia.

O mesmo padrão local do navegador se aplica à substituição do avatar do assistente. Avatares de assistente enviados sobrepõem a identidade resolvida pelo gateway apenas no navegador local e nunca fazem ida e volta por `config.patch`. O campo de configuração compartilhado `ui.assistant.avatar` continua disponível para clientes que não são UI e gravam o campo diretamente (como gateways com script ou dashboards personalizados).

## Endpoint de configuração de runtime

A Control UI busca suas configurações de runtime em `/control-ui-config.json`, resolvido em relação ao caminho base da Control UI do gateway (por exemplo, `/__openclaw__/control-ui-config.json` quando a UI é servida em `/__openclaw__/`). Esse endpoint é protegido pela mesma autenticação do gateway que o restante da superfície HTTP: navegadores não autenticados não conseguem buscá-lo, e uma busca bem-sucedida exige um token/senha de gateway já válido, uma identidade do Tailscale Serve ou uma identidade de proxy confiável.

## Suporte a idiomas

A Control UI pode localizar a si mesma no primeiro carregamento com base no local do seu navegador. Para substituir isso depois, abra **Visão geral -> Acesso ao Gateway -> Idioma**. O seletor de localidade fica no card Acesso ao Gateway, não em Aparência.

- Localidades compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Traduções que não são em inglês são carregadas sob demanda no navegador.
- A localidade selecionada é salva no armazenamento do navegador e reutilizada em visitas futuras.
- Chaves de tradução ausentes recorrem ao inglês.

As traduções da documentação são geradas para o mesmo conjunto de localidades que não são em inglês, mas o seletor de idiomas integrado do site de documentação no Mintlify é limitado aos códigos de localidade aceitos pelo Mintlify. A documentação em tailandês (`th`) e persa (`fa`) ainda é gerada no repositório de publicação; ela pode não aparecer nesse seletor até que o Mintlify ofereça suporte a esses códigos.

## Temas de aparência

O painel Aparência mantém os temas integrados Claw, Knot e Dash, além de um slot de importação tweakcn local do navegador. Para importar um tema, abra o [editor tweakcn](https://tweakcn.com/editor/theme), escolha ou crie um tema, clique em **Compartilhar** e cole o link do tema copiado em Aparência. O importador também aceita URLs de registro `https://tweakcn.com/r/themes/<id>`, URLs do editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, caminhos relativos `/themes/<id>`, IDs brutos de tema e nomes de tema padrão, como `amethyst-haze`.

Aparência também inclui uma configuração de Tamanho do texto local do navegador. A configuração é armazenada com o restante das preferências da Control UI, aplica-se ao texto do chat, texto do compositor, cards de ferramentas e barras laterais do chat, e mantém entradas de texto com pelo menos 16px para que o Safari móvel não aplique zoom automático ao focar.

Temas importados são armazenados apenas no perfil atual do navegador. Eles não são gravados na configuração do gateway e não são sincronizados entre dispositivos. Substituir o tema importado atualiza o único slot local; limpá-lo muda o tema ativo de volta para Claw se o tema importado estava selecionado.

## O que ela pode fazer (hoje)

<AccordionGroup>
  <Accordion title="Chat e conversa">
    - Converse com o modelo via Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Atualizações do histórico do chat solicitam uma janela recente limitada com limites de texto por mensagem para que sessões grandes não obriguem o navegador a renderizar uma carga completa de transcrição antes que o chat fique utilizável.
    - Converse por meio de sessões em tempo real no navegador. A OpenAI usa WebRTC direto, o Google Live usa um token de navegador restrito de uso único via WebSocket, e plugins de voz em tempo real somente de backend usam o transporte de relay do Gateway. Sessões de provedor pertencentes ao cliente começam com `talk.client.create`; sessões de relay do Gateway começam com `talk.session.create`. O relay mantém credenciais de provedor no Gateway enquanto o navegador transmite PCM do microfone por `talk.session.appendAudio`, encaminha chamadas de ferramenta de provedor `openclaw_agent_consult` por `talk.client.toolCall` para a política do Gateway e o modelo OpenClaw maior configurado, e roteia direcionamento por voz de execução ativa por `talk.client.steer` ou `talk.session.steer`.
    - Transmita chamadas de ferramenta + cards de saída de ferramenta ao vivo no Chat (eventos do agente).
    - Aba Atividade com resumos locais do navegador e priorizando redação da atividade de ferramentas ao vivo a partir da entrega existente de eventos `session.tool` / ferramenta.

  </Accordion>
  <Accordion title="Canais, instâncias, sessões, sonhos">
    - Canais: status de canais integrados mais canais de plugins empacotados/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Atualizações de sondagem de canais mantêm o snapshot anterior visível enquanto verificações lentas de provedor terminam, e snapshots parciais são rotulados quando uma sondagem ou auditoria excede seu orçamento de UI.
    - Instâncias: lista de presença + atualização (`system-presence`).
    - Sessões: liste sessões de agentes configurados por padrão, recorra a chaves obsoletas de sessão de agente não configurado e aplique substituições por sessão de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sonhos: status de Dreaming, alternância para ativar/desativar e leitor do Diário de sonhos (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nós, aprovações de execução">
    - Tarefas Cron: listar/adicionar/editar/executar/ativar/desativar + histórico de execução (`cron.*`).
    - Skills: status, ativar/desativar, instalar, atualizações de chave de API (`skills.*`).
    - Nós: lista + capacidades (`node.list`).
    - Aprovações de execução: edite allowlists de gateway ou nó + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuração">
    - Visualize/edite `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP tem uma página de configurações dedicada para servidores configurados, habilitação, resumos de OAuth/filtro/paralelismo, comandos comuns de operador e o editor de configuração `mcp` com escopo.
    - Aplique + reinicie com validação (`config.apply`) e acorde a última sessão ativa.
    - Gravações incluem uma proteção de hash base para evitar sobrescrever edições concorrentes.
    - Gravações (`config.set`/`config.apply`/`config.patch`) fazem preflight da resolução ativa de SecretRef para refs na carga de configuração enviada; refs ativas enviadas não resolvidas são rejeitadas antes da gravação.
    - Salvamentos de formulário descartam placeholders redigidos obsoletos que não podem ser restaurados a partir da configuração salva enquanto preservam valores redigidos que ainda correspondem a segredos salvos.
    - Renderização de esquema + formulário (`config.schema` / `config.schema.lookup`, incluindo `title` / `description` de campo, dicas de UI correspondentes, resumos de filhos imediatos, metadados de documentação em nós aninhados de objeto/curinga/array/composição, além de esquemas de plugin + canal quando disponíveis); o editor JSON bruto fica disponível apenas quando o snapshot tem uma ida e volta bruta segura.
    - Se um snapshot não puder fazer ida e volta segura do texto bruto, a Control UI força o modo Formulário e desativa o modo Bruto para esse snapshot.
    - O editor JSON bruto "Redefinir para salvo" preserva o formato autorado bruto (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, de modo que edições externas sobrevivam a uma redefinição quando o snapshot puder fazer ida e volta com segurança.
    - Valores de objeto SecretRef estruturados são renderizados como somente leitura em entradas de texto de formulário para impedir corrupção acidental de objeto para string.

  </Accordion>
  <Accordion title="Depuração, logs, atualização">
    - Depuração: snapshots de status/saúde/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`).
    - O log de eventos inclui temporizações de atualização/RPC da Control UI, temporizações lentas de renderização de chat/configuração e entradas de responsividade do navegador para frames longos de animação ou tarefas longas quando o navegador expõe esses tipos de entrada PerformanceObserver.
    - Logs: tail ao vivo dos logs de arquivo do gateway com filtro/exportação (`logs.tail`).
    - Atualização: execute uma atualização de pacote/git + reinicie (`update.run`) com um relatório de reinicialização e, em seguida, consulte `update.status` após reconectar para verificar a versão do gateway em execução.

  </Accordion>
  <Accordion title="Observações do painel de trabalhos Cron">
    - Para trabalhos isolados, a entrega usa anunciar resumo por padrão. Você pode mudar para nenhuma se quiser execuções apenas internas.
    - Os campos de canal/destino aparecem quando anunciar está selecionado.
    - O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de webhook HTTP(S) válida.
    - Para trabalhos da sessão principal, os modos de entrega webhook e nenhuma estão disponíveis.
    - Os controles de edição avançada incluem excluir após a execução, limpar substituição de agente, opções cron exatas/escalonadas, substituições de modelo/raciocínio do agente e alternâncias de entrega de melhor esforço.
    - A validação do formulário é inline, com erros no nível do campo; valores inválidos desativam o botão de salvar até serem corrigidos.
    - Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o webhook é enviado sem cabeçalho de autenticação.
    - Fallback obsoleto: execute `openclaw doctor --fix` para migrar trabalhos legados armazenados com `notify: true` de `cron.webhook` para webhook explícito por trabalho ou entrega de conclusão.

  </Accordion>
</AccordionGroup>

## Página MCP

A página MCP dedicada é uma visualização de operador para servidores MCP gerenciados pelo OpenClaw em `mcp.servers`. Ela não inicia transportes MCP por conta própria; use-a para inspecionar e editar a configuração salva e, em seguida, use `openclaw mcp doctor --probe` quando precisar de prova do servidor ao vivo.

Fluxo de trabalho típico:

1. Abra **MCP** na barra lateral.
2. Verifique os cartões de resumo para contagens totais, habilitadas, OAuth e de servidores filtrados.
3. Revise cada linha de servidor quanto a transporte, habilitação, autenticação, filtros, tempos limite e dicas de comando.
4. Alterne a habilitação quando um servidor deve permanecer configurado, mas ficar fora da descoberta em tempo de execução.
5. Edite a seção de configuração `mcp` com escopo para definições de servidor, cabeçalhos, caminhos TLS/mTLS, metadados OAuth, filtros de ferramentas e metadados de projeção do Codex.
6. Use **Salvar** para gravar a configuração, ou **Salvar e Publicar** quando o Gateway em execução deve aplicar a configuração alterada.
7. Execute `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` ou `openclaw mcp reload` em um terminal quando o processo editado precisar de diagnósticos estáticos, prova ao vivo ou descarte de runtime em cache.

A página redige valores semelhantes a URLs que carregam credenciais antes da renderização e coloca nomes de servidor entre aspas nos trechos de comando para que comandos copiados ainda funcionem com espaços ou metacaracteres de shell. A referência completa de CLI e configuração fica em [MCP](/pt-BR/cli/mcp).

## Aba Atividade

A aba Atividade é um observador efêmero local do navegador para atividade de ferramentas ao vivo. Ela é derivada do mesmo fluxo de eventos Gateway `session.tool` / ferramenta que alimenta os cartões de ferramentas do Chat; ela não adiciona outra família de eventos do Gateway, endpoint, armazenamento durável de atividades, feed de métricas ou fluxo de observador externo.

As entradas de Atividade mantêm apenas resumos sanitizados e prévias de saída redigidas e truncadas. Valores de argumentos de ferramentas não são armazenados no estado de Atividade; a interface mostra que os argumentos estão ocultos e registra apenas a contagem de campos de argumento. A lista em memória acompanha a aba atual do navegador, sobrevive à navegação dentro da Control UI e é redefinida ao recarregar a página, trocar de sessão ou clicar em **Limpar**.

## Comportamento do Chat

<AccordionGroup>
  <Accordion title="Semântica de envio e histórico">
    - `chat.send` é **não bloqueante**: confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`. Clientes confiáveis da Control UI também podem receber metadados opcionais de temporização do ACK para diagnósticos locais.
    - Uploads do Chat aceitam imagens e arquivos que não sejam vídeo. Imagens mantêm o caminho de imagem nativo; outros arquivos são armazenados como mídia gerenciada e exibidos no histórico como links de anexo.
    - Reenviar com o mesmo `idempotencyKey` retorna `{ status: "in_flight" }` enquanto está em execução e `{ status: "ok" }` após a conclusão.
    - As respostas de `chat.history` têm limite de tamanho para a segurança da interface. Quando entradas de transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens grandes demais por um placeholder (`[chat.history omitted: message too large]`).
    - Quando uma mensagem visível do assistente foi truncada em `chat.history`, o leitor lateral pode buscar sob demanda a entrada completa da transcrição normalizada para exibição por meio de `chat.message.get` usando `sessionKey`, o `agentId` ativo quando necessário e o `messageId` da transcrição. Se o Gateway ainda não puder retornar mais, o leitor mostra um estado explícito de indisponível em vez de repetir silenciosamente a prévia truncada.
    - Imagens geradas/pelo assistente são persistidas como referências de mídia gerenciada e servidas de volta por URLs de mídia autenticadas do Gateway, então recarregamentos não dependem de payloads de imagem base64 brutos permanecerem na resposta do histórico do chat.
    - Ao renderizar `chat.history`, a Control UI remove tags de diretiva inline apenas de exibição do texto visível do assistente (por exemplo `[[reply_to_*]]` e `[[audio_as_voice]]`), payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos de chamadas de ferramenta truncados) e tokens de controle de modelo ASCII/largura total vazados, e omite entradas do assistente cujo texto visível inteiro é apenas o token silencioso exato `NO_REPLY` / `no_reply` ou o token de confirmação de Heartbeat `HEARTBEAT_OK`.
    - Durante um envio ativo e a atualização final do histórico, a visualização do chat mantém mensagens otimistas locais de usuário/assistente visíveis se `chat.history` retornar brevemente um snapshot mais antigo; a transcrição canônica substitui essas mensagens locais quando o histórico do Gateway se atualiza.
    - Eventos `chat` ao vivo são estado de entrega, enquanto `chat.history` é reconstruído a partir da transcrição durável da sessão. Após eventos finais de ferramenta, a Control UI recarrega o histórico e mescla apenas uma pequena cauda otimista; o limite da transcrição está documentado em [WebChat](/pt-BR/web/webchat).
    - `chat.inject` acrescenta uma nota do assistente à transcrição da sessão e transmite um evento `chat` para atualizações apenas da interface (sem execução de agente, sem entrega por canal).
    - O cabeçalho do chat mostra o filtro de agente antes do seletor de sessão, e o seletor de sessão é escopado pelo agente selecionado. Trocar de agente mostra apenas sessões vinculadas a esse agente e usa como fallback a sessão principal desse agente quando ele ainda não tem sessões de dashboard salvas.
    - Em larguras de desktop, os controles de chat permanecem em uma linha compacta e recolhem ao rolar para baixo na transcrição; rolar para cima, voltar ao topo ou chegar ao fim restaura os controles.
    - Mensagens consecutivas duplicadas apenas de texto são renderizadas como um único balão com um badge de contagem. Mensagens que carregam imagens, anexos, saída de ferramentas ou prévias de canvas não são recolhidas.
    - Os seletores de modelo e raciocínio do cabeçalho do chat aplicam patch à sessão ativa imediatamente por meio de `sessions.patch`; eles são substituições persistentes de sessão, não opções de envio de apenas um turno.
    - Se você enviar uma mensagem enquanto uma alteração do seletor de modelo para a mesma sessão ainda estiver sendo salva, o compositor aguarda esse patch de sessão antes de chamar `chat.send`, para que o envio use o modelo selecionado.
    - Digitar `/new` na Control UI cria e alterna para a mesma sessão nova de dashboard que Novo Chat, exceto quando `session.dmScope: "main"` está configurado e o pai atual é a sessão principal do agente; nesse caso, ela redefine a sessão principal no lugar. Digitar `/reset` mantém a redefinição explícita no lugar do Gateway para a sessão atual.
    - O seletor de modelo do chat solicita a visualização de modelos configurada do Gateway. Se `agents.defaults.models` estiver presente, essa lista de permissões orienta o seletor, incluindo entradas `provider/*` que mantêm catálogos com escopo de provedor dinâmicos. Caso contrário, o seletor mostra entradas explícitas `models.providers.*.models` e provedores com autenticação utilizável. O catálogo completo permanece disponível pelo RPC de depuração `models.list` com `view: "all"`.
    - Quando relatórios recentes de uso de sessão do Gateway incluem tokens de contexto atuais, a área do compositor de chat mostra um indicador compacto de uso de contexto. Ele muda para estilo de aviso sob alta pressão de contexto e, em níveis recomendados de Compaction, mostra um botão compacto que executa o caminho normal de Compaction da sessão. Snapshots de tokens obsoletos ficam ocultos até o Gateway relatar uso recente novamente.

  </Accordion>
  <Accordion title="Modo Talk (tempo real no navegador)">
    O modo Talk usa um provedor de voz em tempo real registrado. Configure OpenAI com `talk.realtime.provider: "openai"` mais um perfil de autenticação de chave de API `openai`, `talk.realtime.providers.openai.apiKey` ou `OPENAI_API_KEY`; perfis OAuth da OpenAI não configuram voz em Realtime. Configure Google com `talk.realtime.provider: "google"` mais `talk.realtime.providers.google.apiKey`. O navegador nunca recebe uma chave de API padrão de provedor. A OpenAI recebe um segredo efêmero de cliente Realtime para WebRTC. O Google Live recebe um token de autenticação da API Live restrito e de uso único para uma sessão WebSocket do navegador, com instruções e declarações de ferramentas bloqueadas no token pelo Gateway. Provedores que expõem apenas uma ponte de tempo real de backend são executados pelo transporte de relay do Gateway, então credenciais e sockets de fornecedores permanecem no lado do servidor enquanto o áudio do navegador passa por RPCs autenticados do Gateway. O prompt da sessão Realtime é montado pelo Gateway; `talk.client.create` não aceita substituições de instruções fornecidas pelo chamador.

    O compositor do Chat inclui um botão de opções do Talk ao lado do botão iniciar/parar Talk. As opções se aplicam à próxima sessão Talk e podem substituir provedor, transporte, modelo, voz, esforço de raciocínio, limiar de VAD, duração de silêncio e preenchimento de prefixo. Quando uma opção está em branco, o Gateway usa padrões configurados quando disponíveis ou o padrão do provedor. Selecionar relay do Gateway força o caminho de relay de backend; selecionar WebRTC mantém a sessão pertencente ao cliente e falha em vez de voltar silenciosamente para relay se o provedor não puder criar uma sessão de navegador.

    No compositor do Chat, o controle Talk é o botão de ondas ao lado do botão de ditado por microfone. Quando o Talk inicia, a linha de status do compositor mostra `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real consulta o modelo maior configurado por meio de `talk.client.toolCall`.

    Smoke ao vivo de mantenedor: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica a ponte WebSocket de backend da OpenAI, a troca SDP WebRTC de navegador da OpenAI, a configuração WebSocket de navegador com token restrito do Google Live e o adaptador de navegador de relay do Gateway com mídia de microfone falsa. O comando imprime apenas o status do provedor e não registra segredos.

  </Accordion>
  <Accordion title="Parar e abortar">
    - Clique em **Parar** (chama `chat.abort`).
    - Enquanto uma execução está ativa, acompanhamentos normais entram na fila. Clique em **Direcionar** em uma mensagem na fila para injetar esse acompanhamento no turno em execução.
    - Digite `/stop` (ou frases autônomas de abortar como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora da banda.
    - `chat.abort` aceita `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão.

  </Accordion>
  <Accordion title="Retenção parcial de aborto">
    - Quando uma execução é abortada, o texto parcial do assistente ainda pode ser mostrado na interface.
    - O Gateway persiste o texto parcial abortado do assistente no histórico de transcrição quando existe saída em buffer.
    - Entradas persistidas incluem metadados de aborto para que consumidores de transcrição consigam distinguir parciais de aborto de saída de conclusão normal.

  </Accordion>
</AccordionGroup>

## Instalação PWA e Web Push

A Control UI inclui um `manifest.webmanifest` e um service worker, para que navegadores modernos possam instalá-la como uma PWA independente. Web Push permite que o Gateway desperte a PWA instalada com notificações mesmo quando a aba ou janela do navegador não está aberta.

Se a página mostrar **Incompatibilidade de protocolo** logo após uma atualização do OpenClaw, primeiro reabra o dashboard com `openclaw dashboard` e force a atualização da página. Se ainda falhar, limpe os dados do site para a origem do dashboard ou teste em uma janela privada do navegador; uma aba antiga ou cache de service worker do navegador pode continuar executando um pacote da Control UI anterior à atualização contra o Gateway mais novo.

| Superfície                                           | O que faz                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifesto PWA. Os navegadores oferecem "Instalar app" quando ele fica acessível. |
| `ui/public/sw.js`                                     | Service worker que lida com eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (no diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente usado para assinar payloads Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints de assinatura de navegador persistidos.                  |

Sobrescreva o par de chaves VAPID por meio de variáveis de ambiente no processo do Gateway quando quiser fixar chaves (para implantações multi-host, rotação de segredos ou testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (o padrão é `https://openclaw.ai`)

A Control UI usa estes métodos do Gateway limitados por escopo para registrar e testar assinaturas de navegador:

- `push.web.vapidPublicKey` — busca a chave pública VAPID ativa.
- `push.web.subscribe` — registra um `endpoint` mais `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — remove um endpoint registrado.
- `push.web.test` — envia uma notificação de teste para a assinatura do chamador.

<Note>
Web Push é independente do caminho de relay APNS do iOS (consulte [Configuração](/pt-BR/gateway/configuration) para push com relay) e do método `push.test` existente, que têm como alvo o pareamento móvel nativo.
</Note>

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`. A política de sandbox do iframe é controlada por `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desativa a execução de scripts dentro de embeds hospedados.
  </Tab>
  <Tab title="scripts (default)">
    Permite embeds interativos mantendo o isolamento de origem; este é o padrão e geralmente é suficiente para jogos/widgets de navegador autocontidos.
  </Tab>
  <Tab title="trusted">
    Adiciona `allow-same-origin` além de `allow-scripts` para documentos do mesmo site que precisam intencionalmente de privilégios mais fortes.
  </Tab>
</Tabs>

Exemplo:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Use `trusted` somente quando o documento incorporado realmente precisar de comportamento de mesma origem. Para a maioria dos jogos e canvases interativos gerados por agentes, `scripts` é a opção mais segura.
</Warning>

URLs externas absolutas de embed `http(s)` continuam bloqueadas por padrão. Se você quiser intencionalmente que `[embed url="https://..."]` carregue páginas de terceiros, defina `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largura de mensagens de chat

Mensagens de chat agrupadas usam uma largura máxima padrão legível. Implantações em monitores largos podem sobrescrevê-la sem corrigir o CSS empacotado definindo `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

O valor é validado antes de chegar ao navegador. Os valores compatíveis incluem comprimentos simples e porcentagens como `960px` ou `82%`, além de expressões de largura restritas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Acesso à tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantenha o Gateway em loopback e deixe o Tailscale Serve fazer proxy dele com HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra:

    - `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

    Por padrão, solicitações Control UI/WebSocket Serve podem autenticar por meio de cabeçalhos de identidade do Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` com `tailscale whois` e comparando-o com o cabeçalho, e só aceita isso quando a solicitação chega pelo loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Para sessões de operador da Control UI com identidade de dispositivo do navegador, esse caminho Serve verificado também ignora a rodada de pareamento de dispositivo; navegadores sem dispositivo e conexões com função de nó ainda seguem as verificações normais de dispositivo. Defina `gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado mesmo para tráfego Serve. Depois use `gateway.auth.mode: "token"` ou `"password"`.

    Para esse caminho assíncrono de identidade Serve, tentativas de autenticação com falha para o mesmo IP de cliente e escopo de autenticação são serializadas antes das gravações de limite de taxa. Portanto, novas tentativas ruins concorrentes do mesmo navegador podem mostrar `retry later` na segunda solicitação em vez de duas incompatibilidades simples competindo em paralelo.

    <Warning>
    A autenticação Serve sem token pressupõe que o host do gateway é confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.
    </Warning>

  </Tab>
  <Tab title="Vincular à tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Depois abra:

    - `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

    Cole o segredo compartilhado correspondente nas configurações da UI (enviado como `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Se você abrir o dashboard por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`), o navegador será executado em um **contexto não seguro** e bloqueará WebCrypto. Por padrão, o OpenClaw **bloqueia** conexões da Control UI sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade HTTP insegura somente para localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida da Control UI do operador por meio de `gateway.auth.mode: "trusted-proxy"`
- opção de emergência `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do gateway)

<AccordionGroup>
  <Accordion title="Comportamento do toggle de autenticação insegura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` é apenas um toggle local de compatibilidade:

    - Ele permite que sessões localhost da Control UI prossigam sem identidade de dispositivo em contextos HTTP não seguros.
    - Ele não ignora verificações de pareamento.
    - Ele não relaxa os requisitos de identidade de dispositivo remoto (não localhost).

  </Accordion>
  <Accordion title="Somente emergência">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` desativa as verificações de identidade de dispositivo da Control UI e é um rebaixamento severo de segurança. Reverta rapidamente após o uso emergencial.
    </Warning>

  </Accordion>
  <Accordion title="Observação sobre proxy confiável">
    - A autenticação trusted-proxy bem-sucedida pode admitir sessões **de operador** da Control UI sem identidade de dispositivo.
    - Isso **não** se estende a sessões da Control UI com função de nó.
    - Proxies reversos de loopback no mesmo host ainda não satisfazem a autenticação trusted-proxy; consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/pt-BR/gateway/tailscale) para obter orientação de configuração HTTPS.

## Política de segurança de conteúdo

A Control UI é fornecida com uma política `img-src` rígida: somente ativos de **mesma origem**, URLs `data:` e URLs `blob:` geradas localmente são permitidas. URLs de imagem remotas `http(s)` e relativas a protocolo são rejeitadas pelo navegador e não emitem buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo `/avatars/<id>`) ainda são renderizados, incluindo rotas de avatar autenticadas que a UI busca e converte em URLs `blob:` locais.
- URLs inline `data:image/...` ainda são renderizadas (útil para payloads dentro do protocolo).
- URLs `blob:` locais criadas pela Control UI ainda são renderizadas.
- URLs remotas de avatar emitidas por metadados de canal são removidas nos helpers de avatar da Control UI e substituídas pelo logotipo/badge integrado, para que um canal comprometido ou malicioso não consiga forçar buscas arbitrárias de imagens remotas a partir do navegador de um operador.

Você não precisa alterar nada para obter esse comportamento — ele está sempre ativo e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do gateway está configurada, o endpoint de avatar da Control UI exige o mesmo token do gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar somente para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas para qualquer uma das rotas são rejeitadas (correspondendo à rota irmã assistant-media). Isso impede que a rota de avatar vaze a identidade do agente em hosts que, de outra forma, estão protegidos.
- A própria Control UI encaminha o token do gateway como um cabeçalho bearer ao buscar avatares e usa URLs blob autenticadas para que a imagem ainda seja renderizada nos dashboards.

Se você desativar a autenticação do gateway (não recomendado em hosts compartilhados), a rota de avatar também se torna não autenticada, alinhada ao restante do gateway.

## Autenticação da rota de mídia do assistente

Quando a autenticação do gateway está configurada, pré-visualizações de mídia local do assistente usam uma rota em duas etapas:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` exige a autenticação normal de operador da Control UI. O navegador envia o token do gateway como um cabeçalho bearer ao verificar disponibilidade.
- Respostas de metadados bem-sucedidas incluem um `mediaTicket` de curta duração com escopo para esse caminho de origem exato.
- URLs de imagem, áudio, vídeo e documento renderizadas pelo navegador usam `mediaTicket=<ticket>` em vez do token ou senha ativos do gateway. O ticket expira rapidamente e não pode autorizar uma origem diferente.

Isso mantém a renderização normal de mídia compatível com elementos de mídia nativos do navegador sem colocar credenciais reutilizáveis do gateway em URLs de mídia visíveis.

## Construindo a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Construa-os com:

```bash
pnpm ui:build
```

Base absoluta opcional (quando você quer URLs de ativos fixas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev
```

Depois aponte a UI para a URL WS do seu Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Página em branco da Control UI

Se o navegador carregar um dashboard em branco e o DevTools não mostrar nenhum erro útil, uma extensão ou script de conteúdo inicial pode ter impedido a avaliação do app de módulo JavaScript. A página estática inclui um painel de recuperação HTML simples que aparece quando `<openclaw-app>` não é registrado após a inicialização.

Use a ação **Tentar novamente** do painel depois de alterar o ambiente do navegador, ou recarregue manualmente após estas verificações:

- Desative extensões que injetam em todas as páginas, especialmente extensões com scripts de conteúdo `<all_urls>`.
- Tente uma janela privada, um perfil de navegador limpo ou outro navegador.
- Mantenha o Gateway em execução e verifique a mesma URL do dashboard após a alteração do navegador.

## Depuração/teste: servidor de desenvolvimento + Gateway remoto

A Control UI é composta por arquivos estáticos; o destino WebSocket é configurável e pode ser diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento Vite localmente, mas o Gateway é executado em outro lugar.

<Steps>
  <Step title="Inicie o servidor de desenvolvimento da UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Abra com gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Autenticação única opcional (se necessário):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Observações">
    - `gatewayUrl` é armazenado em localStorage após o carregamento e removido da URL.
    - Se você passar um endpoint `ws://` ou `wss://` completo via `gatewayUrl`, codifique o valor de `gatewayUrl` para URL para que o navegador analise a string de consulta corretamente.
    - `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de requisição e Referer. Parâmetros de consulta legados `?token=` ainda são importados uma vez para compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
    - `password` é mantido apenas na memória.
    - Quando `gatewayUrl` está definido, a UI não faz fallback para credenciais de configuração ou de ambiente. Forneça `token` (ou `password`) explicitamente. Credenciais explícitas ausentes são um erro.
    - Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
    - `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada) para evitar clickjacking.
    - Implantações públicas da Control UI que não sejam loopback devem definir `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Carregamentos privados de LAN/Tailnet de mesma origem a partir de loopback, RFC1918/link-local, `.local`, `.ts.net` ou hosts CGNAT do Tailscale são aceitos sem habilitar fallback de cabeçalho Host.
    - A inicialização do Gateway pode semear origens locais como `http://localhost:<port>` e `http://127.0.0.1:<port>` a partir do bind e da porta efetivos do runtime, mas origens de navegadores remotos ainda precisam de entradas explícitas.
    - Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto para testes locais estritamente controlados. Isso significa permitir qualquer origem de navegador, não "corresponder a qualquer host que eu esteja usando."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita o modo de fallback de origem por cabeçalho Host, mas é um modo de segurança perigoso.

  </Accordion>
</AccordionGroup>

Exemplo:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detalhes da configuração de acesso remoto: [Acesso remoto](/pt-BR/gateway/remote).

## Relacionado

- [Dashboard](/pt-BR/web/dashboard) — dashboard do gateway
- [Health Checks](/pt-BR/gateway/health) — monitoramento de integridade do gateway
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador

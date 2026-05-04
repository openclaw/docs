---
read_when:
    - Você quer operar o Gateway a partir de um navegador
    - Você quer acesso à Tailnet sem túneis SSH
sidebarTitle: Control UI
summary: UI de controle baseada no navegador para o Gateway (chat, nós, configuração)
title: Interface de controle
x-i18n:
    generated_at: "2026-05-04T05:56:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99a40ab77276fbc3180aefb103c2dd46804829c7b1b6966a8456ed35b85ed644
    source_path: web/control-ui.md
    workflow: 16
---

A Interface de Controle é um pequeno aplicativo de página única **Vite + Lit** servido pelo Gateway:

- padrão: `http://<host>:18789/`
- prefixo opcional: defina `gateway.controlUi.basePath` (por exemplo, `/openclaw`)

Ela se comunica **diretamente com o WebSocket do Gateway** na mesma porta.

## Abertura rápida (local)

Se o Gateway estiver em execução no mesmo computador, abra:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Se a página não carregar, inicie o Gateway primeiro: `openclaw gateway`.

A autenticação é fornecida durante o handshake do WebSocket por meio de:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

O painel de configurações do dashboard mantém um token para a sessão atual da aba do navegador e a URL do gateway selecionada; senhas não são persistidas. A integração inicial normalmente gera um token de gateway para autenticação por segredo compartilhado na primeira conexão, mas a autenticação por senha também funciona quando `gateway.auth.mode` é `"password"`.

## Pareamento de dispositivo (primeira conexão)

Quando você se conecta à Interface de Controle a partir de um novo navegador ou dispositivo, o Gateway geralmente exige uma **aprovação de pareamento única**. Esta é uma medida de segurança para impedir acesso não autorizado.

**O que você verá:** "desconectado (1008): pareamento necessário"

<Steps>
  <Step title="Liste as solicitações pendentes">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Aprove pelo ID da solicitação">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Se o navegador tentar novamente o pareamento com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute `openclaw devices list` novamente antes da aprovação.

Se o navegador já estiver pareado e você alterá-lo de acesso de leitura para acesso de escrita/administrador, isso será tratado como uma atualização de aprovação, não como uma reconexão silenciosa. O OpenClaw mantém a aprovação antiga ativa, bloqueia a reconexão mais ampla e solicita que você aprove explicitamente o novo conjunto de escopos.

Depois de aprovado, o dispositivo é lembrado e não exigirá nova aprovação, a menos que você o revogue com `openclaw devices revoke --device <id> --role <role>`. Consulte [CLI de Dispositivos](/pt-BR/cli/devices) para rotação e revogação de tokens.

<Note>
- Conexões diretas de navegador por local loopback (`127.0.0.1` / `localhost`) são aprovadas automaticamente.
- O Tailscale Serve pode pular a etapa de pareamento para sessões de operador da Interface de Controle quando `gateway.auth.allowTailscale: true`, a identidade do Tailscale é verificada e o navegador apresenta sua identidade de dispositivo.
- Vinculações diretas à Tailnet, conexões de navegador pela LAN e perfis de navegador sem identidade de dispositivo ainda exigem aprovação explícita.
- Cada perfil de navegador gera um ID de dispositivo único, portanto trocar de navegador ou limpar os dados do navegador exigirá novo pareamento.

</Note>

## Identidade pessoal (local do navegador)

A Interface de Controle oferece suporte a uma identidade pessoal por navegador (nome de exibição e avatar) anexada às mensagens enviadas para atribuição em sessões compartilhadas. Ela fica no armazenamento do navegador, é limitada ao perfil atual do navegador e não é sincronizada com outros dispositivos nem persistida no servidor além dos metadados normais de autoria da transcrição nas mensagens que você realmente envia. Limpar os dados do site ou trocar de navegador redefine essa identidade para vazia.

O mesmo padrão local do navegador se aplica à substituição do avatar do assistente. Avatares de assistente enviados sobrepõem a identidade resolvida pelo gateway apenas no navegador local e nunca passam por ida e volta via `config.patch`. O campo de configuração compartilhado `ui.assistant.avatar` ainda está disponível para clientes não UI que escrevem o campo diretamente (como gateways com scripts ou dashboards personalizados).

## Endpoint de configuração de runtime

A Interface de Controle busca suas configurações de runtime em `/__openclaw/control-ui-config.json`. Esse endpoint é protegido pela mesma autenticação do gateway que o restante da superfície HTTP: navegadores não autenticados não conseguem buscá-lo, e uma busca bem-sucedida exige um token/senha de gateway já válido, identidade do Tailscale Serve ou identidade de proxy confiável.

## Suporte a idiomas

A Interface de Controle pode se localizar automaticamente no primeiro carregamento com base na localidade do seu navegador. Para substituí-la depois, abra **Visão geral -> Acesso ao Gateway -> Idioma**. O seletor de localidade fica no cartão Acesso ao Gateway, não em Aparência.

- Localidades compatíveis: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Traduções para idiomas não ingleses são carregadas sob demanda no navegador.
- A localidade selecionada é salva no armazenamento do navegador e reutilizada em visitas futuras.
- Chaves de tradução ausentes recorrem ao inglês.

As traduções da documentação são geradas para o mesmo conjunto de localidades não inglesas, mas o seletor de idioma integrado do site de docs do Mintlify é limitado aos códigos de localidade aceitos pelo Mintlify. A documentação em tailandês (`th`) e persa (`fa`) ainda é gerada no repositório de publicação; ela pode não aparecer nesse seletor até que o Mintlify ofereça suporte a esses códigos.

## Temas de aparência

O painel Aparência mantém os temas integrados Claw, Knot e Dash, além de um slot de importação tweakcn local do navegador. Para importar um tema, abra o [editor tweakcn](https://tweakcn.com/editor/theme), escolha ou crie um tema, clique em **Compartilhar** e cole o link de tema copiado em Aparência. O importador também aceita URLs de registro `https://tweakcn.com/r/themes/<id>`, URLs do editor como `https://tweakcn.com/editor/theme?theme=amethyst-haze`, caminhos relativos `/themes/<id>`, IDs de tema brutos e nomes de tema padrão como `amethyst-haze`.

Temas importados são armazenados apenas no perfil atual do navegador. Eles não são gravados na configuração do gateway e não são sincronizados entre dispositivos. Substituir o tema importado atualiza o único slot local; limpá-lo muda o tema ativo de volta para Claw se o tema importado estava selecionado.

## O que ele pode fazer (hoje)

<AccordionGroup>
  <Accordion title="Chat e Conversa">
    - Converse por chat com o modelo via WS do Gateway (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Converse por sessões realtime do navegador. A OpenAI usa WebRTC direto, o Google Live usa um token de navegador limitado a um único uso via WebSocket, e plugins de voz realtime somente de backend usam o transporte de relay do Gateway. O relay mantém as credenciais do provedor no Gateway enquanto o navegador transmite PCM do microfone por RPCs `talk.realtime.relay*` e envia chamadas de ferramenta `openclaw_agent_consult` de volta por `chat.send` para o modelo OpenClaw maior configurado.
    - Transmita chamadas de ferramentas + cartões de saída de ferramenta ao vivo no Chat (eventos de agente).

  </Accordion>
  <Accordion title="Canais, instâncias, sessões, dreams">
    - Canais: status de canais integrados e de canais de plugins incluídos/externos, login por QR e configuração por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Instâncias: lista de presença + atualização (`system-presence`).
    - Sessões: lista + substituições por sessão de modelo/thinking/rápido/detalhado/rastreamento/raciocínio (`sessions.list`, `sessions.patch`).
    - Dreams: status de dreaming, alternância de ativar/desativar e leitor do Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, aprovações de exec">
    - Tarefas Cron: listar/adicionar/editar/executar/ativar/desativar + histórico de execução (`cron.*`).
    - Skills: status, ativar/desativar, instalar, atualizações de chave de API (`skills.*`).
    - Nodes: lista + capacidades (`node.list`).
    - Aprovações de exec: editar allowlists de gateway ou node + política de solicitação para `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Configuração">
    - Visualize/edite `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Aplique + reinicie com validação (`config.apply`) e desperte a última sessão ativa.
    - Gravações incluem uma proteção por hash base para evitar sobrescrever edições concorrentes.
    - Gravações (`config.set`/`config.apply`/`config.patch`) fazem uma pré-verificação da resolução de SecretRef ativa para refs no payload de configuração enviado; refs enviadas ativas não resolvidas são rejeitadas antes da gravação.
    - Esquema + renderização de formulário (`config.schema` / `config.schema.lookup`, incluindo `title` / `description` de campo, dicas de UI correspondentes, resumos de filhos imediatos, metadados de docs em nós aninhados de objeto/curinga/array/composição, além de esquemas de plugin + canal quando disponíveis); o editor JSON bruto fica disponível apenas quando o snapshot tem uma ida e volta bruta segura.
    - Se um snapshot não conseguir fazer ida e volta segura do texto bruto, a Interface de Controle força o modo Formulário e desativa o modo Bruto para esse snapshot.
    - O editor JSON bruto "Redefinir para salvo" preserva a forma escrita em bruto (formatação, comentários, layout de `$include`) em vez de renderizar novamente um snapshot achatado, para que edições externas sobrevivam a uma redefinição quando o snapshot puder fazer ida e volta com segurança.
    - Valores estruturados de objeto SecretRef são renderizados como somente leitura em entradas de texto de formulário para evitar corrupção acidental de objeto para string.

  </Accordion>
  <Accordion title="Depuração, logs, atualização">
    - Depuração: snapshots de status/health/modelos + log de eventos + chamadas RPC manuais (`status`, `health`, `models.list`).
    - Logs: tail ao vivo dos logs de arquivo do gateway com filtro/exportação (`logs.tail`).
    - Atualização: execute uma atualização de pacote/git + reinício (`update.run`) com um relatório de reinício e, em seguida, consulte `update.status` após a reconexão para verificar a versão do gateway em execução.

  </Accordion>
  <Accordion title="Observações do painel de tarefas Cron">
    - Para tarefas isoladas, a entrega usa anúncio de resumo por padrão. Você pode mudar para nenhuma se quiser execuções apenas internas.
    - Campos de canal/destino aparecem quando anúncio é selecionado.
    - O modo Webhook usa `delivery.mode = "webhook"` com `delivery.to` definido como uma URL de webhook HTTP(S) válida.
    - Para tarefas da sessão principal, os modos de entrega webhook e nenhuma ficam disponíveis.
    - Controles avançados de edição incluem excluir após execução, limpar substituição de agente, opções cron exato/escalonado, substituições de modelo/thinking do agente e alternâncias de entrega por melhor esforço.
    - A validação de formulário é inline com erros por campo; valores inválidos desativam o botão de salvar até serem corrigidos.
    - Defina `cron.webhookToken` para enviar um token bearer dedicado; se omitido, o webhook é enviado sem cabeçalho de autenticação.
    - Fallback obsoleto: tarefas legadas armazenadas com `notify: true` ainda podem usar `cron.webhook` até serem migradas.

  </Accordion>
</AccordionGroup>

## Comportamento do chat

<AccordionGroup>
  <Accordion title="Semântica de envio e histórico">
    - `chat.send` é **não bloqueante**: confirma imediatamente com `{ runId, status: "started" }` e a resposta é transmitida por eventos `chat`.
    - Uploads de chat aceitam imagens e arquivos que não sejam vídeo. Imagens mantêm o caminho nativo da imagem; outros arquivos são armazenados como mídia gerenciada e exibidos no histórico como links de anexo.
    - Reenviar com o mesmo `idempotencyKey` retorna `{ status: "in_flight" }` enquanto estiver em execução, e `{ status: "ok" }` após a conclusão.
    - As respostas de `chat.history` têm limite de tamanho para segurança da UI. Quando as entradas da transcrição são grandes demais, o Gateway pode truncar campos de texto longos, omitir blocos pesados de metadados e substituir mensagens grandes demais por um placeholder (`[chat.history omitted: message too large]`).
    - Imagens geradas/pelo assistente são persistidas como referências de mídia gerenciada e servidas de volta por URLs de mídia autenticadas do Gateway, então recarregamentos não dependem de payloads brutos de imagem em base64 permanecerem na resposta do histórico do chat.
    - `chat.history` também remove tags de diretivas inline somente de exibição do texto visível do assistente (por exemplo `[[reply_to_*]]` e `[[audio_as_voice]]`), payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), e tokens de controle de modelo ASCII/largura total vazados, e omite entradas do assistente cujo texto visível inteiro seja apenas o token silencioso exato `NO_REPLY` / `no_reply`.
    - Durante um envio ativo e a atualização final do histórico, a visualização de chat mantém mensagens locais otimistas do usuário/assistente visíveis se `chat.history` retornar brevemente um snapshot mais antigo; a transcrição canônica substitui essas mensagens locais quando o histórico do Gateway alcança o estado atual.
    - Eventos `chat` ao vivo representam estado de entrega, enquanto `chat.history` é reconstruído a partir da transcrição durável da sessão. Após eventos finais de ferramenta, a Control UI recarrega o histórico e mescla apenas uma pequena cauda otimista; o limite da transcrição está documentado em [WebChat](/pt-BR/web/webchat).
    - `chat.inject` anexa uma nota do assistente à transcrição da sessão e transmite um evento `chat` para atualizações somente da UI (sem execução do agente, sem entrega de canal).
    - Os seletores de modelo e pensamento do cabeçalho do chat aplicam patches imediatamente na sessão ativa por meio de `sessions.patch`; eles são sobrescritas persistentes de sessão, não opções de envio válidas apenas para uma rodada.
    - Digitar `/new` na Control UI cria e alterna para a mesma sessão nova de dashboard que Novo Chat. Digitar `/reset` mantém a redefinição explícita in-place do Gateway para a sessão atual.
    - O seletor de modelo do chat solicita a visualização de modelos configurada do Gateway. Se `agents.defaults.models` estiver presente, essa lista de permissões orienta o seletor. Caso contrário, o seletor mostra entradas explícitas de `models.providers.*.models` e provedores com autenticação utilizável. O catálogo completo permanece disponível pelo RPC de depuração `models.list` com `view: "all"`.
    - Quando relatórios novos de uso da sessão do Gateway mostram alta pressão de contexto, a área do compositor de chat mostra um aviso de contexto e, em níveis recomendados de compaction, um botão compacto que executa o caminho normal de compaction da sessão. Snapshots obsoletos de tokens ficam ocultos até o Gateway relatar uso novo novamente.

  </Accordion>
  <Accordion title="Modo de conversa (tempo real no navegador)">
    O modo de conversa usa um provedor de voz em tempo real registrado. Configure a OpenAI com `talk.provider: "openai"` mais `talk.providers.openai.apiKey`, ou configure o Google com `talk.provider: "google"` mais `talk.providers.google.apiKey`; a configuração do provedor em tempo real de Chamada de Voz ainda pode ser reutilizada como fallback. O navegador nunca recebe uma chave de API padrão do provedor. A OpenAI recebe um segredo efêmero de cliente Realtime para WebRTC. O Google Live recebe um token de autenticação Live API restrito de uso único para uma sessão WebSocket do navegador, com instruções e declarações de ferramentas travadas no token pelo Gateway. Provedores que expõem apenas uma ponte em tempo real de backend passam pelo transporte de retransmissão do Gateway, então credenciais e sockets de fornecedores ficam no lado do servidor enquanto o áudio do navegador passa por RPCs autenticados do Gateway. O prompt da sessão Realtime é montado pelo Gateway; `talk.realtime.session` não aceita sobrescritas de instrução fornecidas pelo chamador.

    No compositor de Chat, o controle de Conversa é o botão de ondas ao lado do botão de ditado por microfone. Quando a Conversa inicia, a linha de status do compositor mostra `Connecting Talk...`, depois `Talk live` enquanto o áudio está conectado, ou `Asking OpenClaw...` enquanto uma chamada de ferramenta em tempo real consulta o modelo maior configurado por meio de `chat.send`.

    Smoke ao vivo para mantenedores: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` verifica a troca de SDP WebRTC do navegador da OpenAI, a configuração WebSocket do navegador com token restrito do Google Live e o adaptador de navegador de retransmissão do Gateway com mídia de microfone falsa. O comando imprime apenas o status do provedor e não registra segredos.

  </Accordion>
  <Accordion title="Parar e abortar">
    - Clique em **Parar** (chama `chat.abort`).
    - Enquanto uma execução está ativa, acompanhamentos normais entram na fila. Clique em **Orientar** em uma mensagem na fila para injetar esse acompanhamento na rodada em execução.
    - Digite `/stop` (ou frases independentes de aborto como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fora de banda.
    - `chat.abort` oferece suporte a `{ sessionKey }` (sem `runId`) para abortar todas as execuções ativas dessa sessão.

  </Accordion>
  <Accordion title="Retenção parcial de aborto">
    - Quando uma execução é abortada, o texto parcial do assistente ainda pode ser mostrado na UI.
    - O Gateway persiste texto parcial abortado do assistente no histórico da transcrição quando há saída em buffer.
    - Entradas persistidas incluem metadados de aborto para que consumidores da transcrição consigam distinguir parciais de aborto da saída de conclusão normal.

  </Accordion>
</AccordionGroup>

## Instalação PWA e push web

A Control UI inclui um `manifest.webmanifest` e um service worker, então navegadores modernos podem instalá-la como uma PWA independente. Web Push permite que o Gateway acorde a PWA instalada com notificações mesmo quando a aba ou a janela do navegador não está aberta.

| Superfície                                            | O que faz                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifesto PWA. Navegadores oferecem "Instalar app" quando ele fica acessível. |
| `ui/public/sw.js`                                     | Service worker que trata eventos `push` e cliques em notificações. |
| `push/vapid-keys.json` (sob o diretório de estado do OpenClaw) | Par de chaves VAPID gerado automaticamente usado para assinar payloads Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoints persistidos de assinatura do navegador.                  |

Sobrescreva o par de chaves VAPID por variáveis de ambiente no processo do Gateway quando quiser fixar chaves (para implantações multi-host, rotação de segredos ou testes):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (padrão: `mailto:openclaw@localhost`)

A Control UI usa estes métodos do Gateway com escopo limitado para registrar e testar assinaturas do navegador:

- `push.web.vapidPublicKey` — busca a chave pública VAPID ativa.
- `push.web.subscribe` — registra um `endpoint` mais `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — remove um endpoint registrado.
- `push.web.test` — envia uma notificação de teste para a assinatura do chamador.

<Note>
Web Push é independente do caminho de retransmissão APNS do iOS (veja [Configuração](/pt-BR/gateway/configuration) para push apoiado por retransmissão) e do método `push.test` existente, que mira o pareamento móvel nativo.
</Note>

## Embeds hospedados

Mensagens do assistente podem renderizar conteúdo web hospedado inline com o shortcode `[embed ...]`. A política de sandbox do iframe é controlada por `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desabilita a execução de scripts dentro de embeds hospedados.
  </Tab>
  <Tab title="scripts (default)">
    Permite embeds interativos enquanto mantém isolamento de origem; este é o padrão e geralmente é suficiente para jogos/widgets de navegador autossuficientes.
  </Tab>
  <Tab title="trusted">
    Adiciona `allow-same-origin` além de `allow-scripts` para documentos do mesmo site que intencionalmente precisam de privilégios mais fortes.
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
Use `trusted` somente quando o documento incorporado realmente precisar de comportamento de mesma origem. Para a maioria dos jogos gerados por agente e canvases interativos, `scripts` é a escolha mais segura.
</Warning>

URLs externas absolutas de embed `http(s)` permanecem bloqueadas por padrão. Se você intencionalmente quiser que `[embed url="https://..."]` carregue páginas de terceiros, defina `gateway.controlUi.allowExternalEmbedUrls: true`.

## Largura da mensagem de chat

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

O valor é validado antes de chegar ao navegador. Valores com suporte incluem comprimentos simples e porcentagens como `960px` ou `82%`, além de expressões de largura restritas `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` e `fit-content(...)`.

## Acesso à tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferencial)">
    Mantenha o Gateway no loopback e deixe o Tailscale Serve fazer proxy dele com HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abra:

    - `https://<magicdns>/` (ou seu `gateway.controlUi.basePath` configurado)

    Por padrão, solicitações Serve da Control UI/WebSocket podem autenticar por cabeçalhos de identidade do Tailscale (`tailscale-user-login`) quando `gateway.auth.allowTailscale` é `true`. O OpenClaw verifica a identidade resolvendo o endereço `x-forwarded-for` com `tailscale whois` e comparando-o ao cabeçalho, e só aceita essas solicitações quando elas chegam ao loopback com os cabeçalhos `x-forwarded-*` do Tailscale. Para sessões de operador da Control UI com identidade de dispositivo do navegador, esse caminho Serve verificado também pula a rodada de pareamento de dispositivo; navegadores sem dispositivo e conexões com função de nó ainda seguem as verificações normais de dispositivo. Defina `gateway.auth.allowTailscale: false` se quiser exigir credenciais explícitas de segredo compartilhado mesmo para tráfego Serve. Então use `gateway.auth.mode: "token"` ou `"password"`.

    Para esse caminho assíncrono de identidade Serve, tentativas de autenticação com falha para o mesmo IP de cliente e escopo de autenticação são serializadas antes das gravações de limite de taxa. Novas tentativas ruins concorrentes do mesmo navegador podem, portanto, mostrar `retry later` na segunda solicitação em vez de duas incompatibilidades simples competindo em paralelo.

    <Warning>
    Autenticação Serve sem token pressupõe que o host do gateway é confiável. Se código local não confiável puder ser executado nesse host, exija autenticação por token/senha.
    </Warning>

  </Tab>
  <Tab title="Vincular à tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Então abra:

    - `http://<tailscale-ip>:18789/` (ou seu `gateway.controlUi.basePath` configurado)

    Cole o segredo compartilhado correspondente nas configurações da UI (enviado como `connect.params.auth.token` ou `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Se você abrir o dashboard por HTTP simples (`http://<lan-ip>` ou `http://<tailscale-ip>`), o navegador executa em um **contexto não seguro** e bloqueia WebCrypto. Por padrão, o OpenClaw **bloqueia** conexões da Control UI sem identidade de dispositivo.

Exceções documentadas:

- compatibilidade HTTP insegura somente para localhost com `gateway.controlUi.allowInsecureAuth=true`
- autenticação bem-sucedida da Control UI de operador por `gateway.auth.mode: "trusted-proxy"`
- exceção de emergência `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Correção recomendada:** use HTTPS (Tailscale Serve) ou abra a UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (no host do gateway)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` é apenas uma alternância de compatibilidade local:

    - Ela permite que sessões da Control UI no localhost prossigam sem identidade do dispositivo em contextos HTTP não seguros.
    - Ela não ignora verificações de pareamento.
    - Ela não relaxa os requisitos de identidade do dispositivo remoto (não localhost).

  </Accordion>
  <Accordion title="Break-glass only">
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
    `dangerouslyDisableDeviceAuth` desativa as verificações de identidade do dispositivo da Control UI e é um rebaixamento grave de segurança. Reverta rapidamente após o uso emergencial.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Uma autenticação bem-sucedida de proxy confiável pode admitir sessões **operator** da Control UI sem identidade do dispositivo.
    - Isso **não** se estende a sessões da Control UI com função de nó.
    - Proxies reversos de loopback no mesmo host ainda não satisfazem a autenticação de proxy confiável; consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Consulte [Tailscale](/pt-BR/gateway/tailscale) para orientações de configuração de HTTPS.

## Política de segurança de conteúdo

A Control UI é fornecida com uma política `img-src` restrita: somente ativos de **mesma origem**, URLs `data:` e URLs `blob:` geradas localmente são permitidos. URLs de imagem remotas `http(s)` e relativas ao protocolo são rejeitadas pelo navegador e não emitem buscas de rede.

O que isso significa na prática:

- Avatares e imagens servidos em caminhos relativos (por exemplo, `/avatars/<id>`) ainda são renderizados, incluindo rotas de avatar autenticadas que a UI busca e converte em URLs `blob:` locais.
- URLs inline `data:image/...` ainda são renderizadas (úteis para payloads no protocolo).
- URLs `blob:` locais criadas pela Control UI ainda são renderizadas.
- URLs de avatar remotas emitidas por metadados de canais são removidas pelos auxiliares de avatar da Control UI e substituídas pelo logotipo/distintivo integrado, para que um canal comprometido ou malicioso não consiga forçar buscas arbitrárias de imagens remotas a partir do navegador de um operador.

Você não precisa alterar nada para obter esse comportamento — ele está sempre ativo e não é configurável.

## Autenticação da rota de avatar

Quando a autenticação do gateway está configurada, o endpoint de avatar da Control UI exige o mesmo token do gateway que o restante da API:

- `GET /avatar/<agentId>` retorna a imagem do avatar somente para chamadores autenticados. `GET /avatar/<agentId>?meta=1` retorna os metadados do avatar sob a mesma regra.
- Solicitações não autenticadas para qualquer uma das rotas são rejeitadas (correspondendo à rota irmã de mídia do assistente). Isso impede que a rota de avatar vaze a identidade do agente em hosts que, de outra forma, estão protegidos.
- A própria Control UI encaminha o token do gateway como um cabeçalho bearer ao buscar avatares e usa URLs de blob autenticadas para que a imagem ainda seja renderizada em painéis.

Se você desativar a autenticação do gateway (não recomendado em hosts compartilhados), a rota de avatar também se torna não autenticada, em linha com o restante do gateway.

## Compilando a UI

O Gateway serve arquivos estáticos de `dist/control-ui`. Compile-os com:

```bash
pnpm ui:build
```

Base absoluta opcional (quando você quiser URLs de ativos fixas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desenvolvimento local (servidor de desenvolvimento separado):

```bash
pnpm ui:dev
```

Depois aponte a UI para a URL WS do seu Gateway (por exemplo, `ws://127.0.0.1:18789`).

## Depuração/testes: servidor de desenvolvimento + Gateway remoto

A Control UI é composta por arquivos estáticos; o destino do WebSocket é configurável e pode ser diferente da origem HTTP. Isso é útil quando você quer o servidor de desenvolvimento Vite localmente, mas o Gateway é executado em outro lugar.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Autenticação opcional de uso único (se necessário):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` é armazenado no localStorage após o carregamento e removido da URL.
    - Se você passar um endpoint `ws://` ou `wss://` completo via `gatewayUrl`, codifique o valor de `gatewayUrl` para URL para que o navegador analise a string de consulta corretamente.
    - `token` deve ser passado pelo fragmento da URL (`#token=...`) sempre que possível. Fragmentos não são enviados ao servidor, o que evita vazamento em logs de solicitação e Referer. Parâmetros de consulta legados `?token=` ainda são importados uma vez por compatibilidade, mas apenas como fallback, e são removidos imediatamente após o bootstrap.
    - `password` é mantido apenas na memória.
    - Quando `gatewayUrl` está definido, a UI não faz fallback para credenciais de configuração ou ambiente. Forneça `token` (ou `password`) explicitamente. A falta de credenciais explícitas é um erro.
    - Use `wss://` quando o Gateway estiver atrás de TLS (Tailscale Serve, proxy HTTPS etc.).
    - `gatewayUrl` só é aceito em uma janela de nível superior (não incorporada) para evitar clickjacking.
    - Implantações da Control UI que não sejam de loopback devem definir `gateway.controlUi.allowedOrigins` explicitamente (origens completas). Isso inclui configurações de desenvolvimento remotas.
    - A inicialização do Gateway pode semear origens locais como `http://localhost:<port>` e `http://127.0.0.1:<port>` a partir do bind e da porta efetivos em tempo de execução, mas origens de navegadores remotos ainda precisam de entradas explícitas.
    - Não use `gateway.controlUi.allowedOrigins: ["*"]` exceto para testes locais rigidamente controlados. Isso significa permitir qualquer origem de navegador, não "corresponder ao host que eu estiver usando."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita o modo de fallback de origem pelo cabeçalho Host, mas é um modo de segurança perigoso.

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

Detalhes de configuração de acesso remoto: [Acesso remoto](/pt-BR/gateway/remote).

## Relacionados

- [Painel](/pt-BR/web/dashboard) — painel do gateway
- [Verificações de integridade](/pt-BR/gateway/health) — monitoramento de integridade do gateway
- [TUI](/pt-BR/web/tui) — interface de usuário de terminal
- [WebChat](/pt-BR/web/webchat) — interface de chat baseada em navegador

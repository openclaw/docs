---
read_when:
    - Configurando o suporte ao iMessage
    - Depuração de envio/recebimento do iMessage
summary: Suporte nativo ao iMessage via imsg (JSON-RPC por stdio), com ações de API privada para respostas, tapbacks, efeitos, anexos e gerenciamento de grupos. Preferencial para novas configurações de iMessage do OpenClaw quando os requisitos do host são atendidos.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para implantações de iMessage do OpenClaw, use `imsg` em um host macOS Messages com sessão iniciada. Se o seu Gateway roda em Linux ou Windows, aponte `channels.imessage.cliPath` para um wrapper SSH que execute `imsg` no Mac.

**A recuperação de entrada é automática.** Após uma reinicialização da ponte ou do gateway, o iMessage reproduz as mensagens perdidas enquanto estava fora do ar e suprime a "bomba de backlog" obsoleta que a Apple pode descarregar após uma recuperação Push, com deduplicação para que nada seja despachado duas vezes. Não há configuração para habilitar — veja [Recuperação de entrada após uma reinicialização da ponte ou do gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
O suporte ao BlueBubbles foi removido. Migre configurações `channels.bluebubbles` para `channels.imessage`; o OpenClaw oferece suporte ao iMessage apenas por meio de `imsg`. Comece por [Remoção do BlueBubbles e o caminho imsg do iMessage](/pt-BR/announcements/bluebubbles-imessage) para o anúncio curto, ou [Vindo do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) para a tabela completa de migração.
</Warning>

Status: integração nativa de CLI externa. O Gateway inicia `imsg rpc` e se comunica por JSON-RPC em stdio (sem daemon/porta separado). Ações avançadas exigem `imsg launch` e uma sondagem bem-sucedida da API privada.

<CardGroup cols={3}>
  <Card title="Ações da API privada" icon="wand-sparkles" href="#private-api-actions">
    Respostas, tapbacks, efeitos, anexos e gerenciamento de grupos.
  </Card>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    DMs do iMessage usam o modo de pareamento por padrão.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Use um wrapper SSH quando o Gateway não estiver rodando no Mac do Messages.
  </Card>
  <Card title="Referência de configuração" icon="settings" href="/pt-BR/gateway/config-channels#imessage">
    Referência completa dos campos do iMessage.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Mac local (caminho rápido)">
    <Steps>
      <Step title="Instale e verifique o imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure o OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Inicie o gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Aprove o primeiro pareamento por DM (dmPolicy padrão)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Solicitações de pareamento expiram após 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto por SSH">
    O OpenClaw exige apenas um `cliPath` compatível com stdio, então você pode apontar `cliPath` para um script wrapper que use SSH para se conectar a um Mac remoto e executar `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configuração recomendada quando anexos estão habilitados:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` não estiver definido, o OpenClaw tenta detectá-lo automaticamente analisando o script wrapper SSH.
    `remoteHost` deve ser `host` ou `user@host` (sem espaços ou opções SSH).
    O OpenClaw usa verificação estrita de chave de host para SCP, portanto a chave do host de retransmissão já deve existir em `~/.ssh/known_hosts`.
    Caminhos de anexos são validados contra raízes permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Qualquer wrapper `cliPath` ou proxy SSH que você colocar na frente de `imsg` DEVE se comportar como um pipe stdio transparente para JSON-RPC de longa duração. O OpenClaw troca pequenas mensagens JSON-RPC delimitadas por nova linha pelo stdin/stdout do wrapper durante todo o ciclo de vida do canal:

- Encaminhe cada bloco/linha de stdin **assim que bytes estiverem disponíveis** — não espere por EOF.
- Encaminhe cada bloco/linha de stdout prontamente na direção inversa.
- Preserve novas linhas.
- Evite leituras bloqueantes de tamanho fixo (`read(4096)`, `cat | buffer`, `read` padrão do shell) que podem privar frames pequenos.
- Mantenha stderr separado do fluxo stdout de JSON-RPC.

Um wrapper que armazena stdin em buffer até preencher um bloco grande produzirá sintomas parecidos com uma interrupção do iMessage — `imsg rpc timeout (chats.list)` ou reinicializações repetidas do canal — mesmo que o próprio `imsg rpc` esteja saudável. `ssh -T host imsg "$@"` (acima) é seguro porque encaminha os argumentos `cliPath` do OpenClaw, como `rpc` e `--db`. Pipelines como `ssh host imsg | grep -v '^DEBUG'` NÃO são seguros — ferramentas com buffer por linha ainda podem reter frames; use `stdbuf -oL -eL` em cada estágio se precisar filtrar.
</Warning>

  </Tab>
</Tabs>

## Requisitos e permissões (macOS)

- O Messages deve estar com sessão iniciada no Mac que executa `imsg`.
- Acesso Total ao Disco é necessário para o contexto do processo que executa OpenClaw/`imsg` (acesso ao banco de dados do Messages).
- A permissão de Automação é necessária para enviar mensagens pelo Messages.app.
- Para ações avançadas (reagir / editar / cancelar envio / resposta em thread / efeitos / operações de grupo), a Proteção da Integridade do Sistema deve estar desabilitada — veja [Habilitando a API privada do imsg](#enabling-the-imsg-private-api) abaixo. Envio/recebimento básico de texto e mídia funciona sem isso.

<Tip>
As permissões são concedidas por contexto de processo. Se o gateway roda sem interface (LaunchAgent/SSH), execute uma vez um comando interativo nesse mesmo contexto para acionar os prompts:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Envios pelo wrapper SSH falham com AppleEvents -1743">
  Uma configuração por SSH remoto pode ler chats, passar em `channels status --probe` e processar mensagens de entrada enquanto envios de saída ainda falham com um erro de autorização AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Verifique o banco de dados TCC do usuário com sessão iniciada no Mac ou Ajustes do Sistema > Privacidade e Segurança > Automação. Se a entrada de Automação estiver registrada para `/usr/libexec/sshd-keygen-wrapper` em vez do processo `imsg` ou do shell local, o macOS pode não expor uma alternância utilizável do Messages para esse cliente do lado do servidor SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Nesse estado, repetir `tccutil reset AppleEvents` ou executar novamente `imsg send` pelo mesmo wrapper SSH pode continuar falhando porque o contexto de processo que precisa da Automação do Messages é o wrapper SSH, não um app ao qual a UI possa conceder permissão.

Use um dos contextos de processo `imsg` compatíveis em vez disso:

- Execute o Gateway, ou pelo menos a ponte `imsg`, na sessão local do usuário do Messages com login ativo.
- Inicie o Gateway com um LaunchAgent para esse usuário após conceder Acesso Total ao Disco e Automação pela mesma sessão.
- Se você mantiver a topologia SSH com dois usuários, verifique se um `imsg send` de saída real funciona pelo wrapper exato antes de habilitar o canal. Se a Automação não puder ser concedida, reconfigure para uma configuração `imsg` de usuário único em vez de depender do wrapper SSH para envios.

</Accordion>

## Habilitando a API privada do imsg

`imsg` vem em dois modos operacionais:

- **Modo básico** (padrão, sem necessidade de alterações no SIP): texto e mídia de saída via `send`, monitoramento/histórico de entrada, lista de chats. É isso que você obtém imediatamente após um `brew install steipete/tap/imsg` novo mais as permissões padrão do macOS acima.
- **Modo API privada**: `imsg` injeta uma dylib auxiliar no `Messages.app` para chamar funções internas do `IMCore`. É isso que desbloqueia `react`, `edit`, `unsend`, `reply` (em thread), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, além de indicadores de digitação e confirmações de leitura.

Para acessar a superfície de ações avançadas documentada nesta página do canal, você precisa do modo API privada. O README do `imsg` é explícito sobre o requisito:

> Recursos avançados como `read`, `typing`, `launch`, envio rico apoiado por ponte, mutação de mensagens e gerenciamento de chats são opcionais. Eles exigem que o SIP esteja desabilitado e que uma dylib auxiliar seja injetada no `Messages.app`. `imsg launch` se recusa a injetar quando o SIP está habilitado.

A técnica de injeção do auxiliar usa a própria dylib do `imsg` para acessar APIs privadas do Messages. Não há servidor de terceiros nem runtime BlueBubbles no caminho iMessage do OpenClaw.

<Warning>
**Desabilitar o SIP é uma concessão real de segurança.** O SIP é uma das proteções centrais do macOS contra execução de código de sistema modificado; desligá-lo em todo o sistema abre superfície de ataque adicional e efeitos colaterais. Em especial, **desabilitar o SIP em Macs Apple Silicon também desabilita a capacidade de instalar e executar apps iOS no seu Mac**.

Trate isso como uma escolha operacional deliberada, não como padrão. Se o seu modelo de ameaça não tolera SIP desligado, o iMessage incluído fica limitado ao modo básico — apenas envio/recebimento de texto e mídia, sem reações / edição / cancelamento de envio / efeitos / operações de grupo.
</Warning>

### Configuração

1. **Instale (ou atualize) `imsg`** no Mac que executa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   A saída de `imsg status --json` relata `bridge_version`, `rpc_methods` e `selectors` por método, para que você possa ver o que a build atual oferece antes de começar.

2. **Desabilite a Proteção da Integridade do Sistema e, no macOS moderno, a Validação de Biblioteca.** Injetar uma dylib auxiliar não Apple no `Messages.app` assinado pela Apple exige SIP desligado **e** validação de biblioteca relaxada. A etapa de SIP no modo de Recuperação é específica da versão do macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** desabilite a Validação de Biblioteca pelo Terminal, reinicie em Modo de Recuperação, execute `csrutil disable`, reinicie.
   - **macOS 11+ (Big Sur e posterior), Intel:** Modo de Recuperação (ou Recuperação pela Internet), `csrutil disable`, reinicie.
   - **macOS 11+, Apple Silicon:** sequência de inicialização pelo botão liga/desliga para entrar na Recuperação; em versões recentes do macOS, mantenha pressionada a tecla **Shift esquerda** ao clicar em Continuar, depois `csrutil disable`. Configurações de máquina virtual seguem um fluxo separado, então faça um snapshot da VM primeiro.

   **No macOS 11 e posterior, `csrutil disable` sozinho geralmente não é suficiente.** A Apple ainda impõe validação de biblioteca contra `Messages.app` como binário de plataforma, então um auxiliar assinado ad hoc é rejeitado (`Library Validation failed: ... platform binary, but mapped file is not`) mesmo com SIP desligado. Após desabilitar o SIP, desabilite também a validação de biblioteca e reinicie:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificado na 26.5.1:** SIP desligado **mais** o comando `DisableLibraryValidation` acima é suficiente para injetar o auxiliar da 26.0 até a 26.5.x. **Nenhum boot-args é necessário.** O plist é o fator decisivo e a etapa ausente mais comum quando a injeção falha no Tahoe:
   - **Com o plist:** `imsg launch` injeta e `imsg status` relata `advanced_features: true`.
   - **Sem o plist (mesmo com SIP desligado):** `imsg launch` falha com `Failed to launch: Timeout waiting for Messages.app to initialize`. O AMFI rejeita o auxiliar ad hoc no carregamento, então a ponte nunca fica pronta e o lançamento expira. Esse timeout é o sintoma que a maioria das pessoas encontra no Tahoe, e a correção é o plist acima, não algo mais drástico.

   Isso foi confirmado com um antes/depois controlado no macOS 26.5.1 (Apple Silicon): com o plist, a dylib é mapeada para dentro do `Messages.app` e a ponte sobe; remova o plist e reinicie, e `imsg launch` produz a falha de timeout acima com a dylib não mapeada.

   Se a injeção de `imsg launch` ou `selectors` específicos começarem a retornar falso depois de uma atualização do macOS, esse gate é a causa usual. Verifique o estado do SIP e da validação de biblioteca antes de presumir que a própria etapa do SIP falhou. Se essas configurações estiverem corretas e a bridge ainda não conseguir injetar, colete `imsg status --json` junto com a saída de `imsg launch` e reporte ao projeto `imsg` em vez de enfraquecer controles adicionais de segurança em todo o sistema.

   Siga o fluxo do modo de Recuperação da Apple para o seu Mac para desativar o SIP antes de executar `imsg launch`.

3. **Injete o helper.** Com o SIP desativado e o Messages.app conectado:

   ```bash
   imsg launch
   ```

   `imsg launch` se recusa a injetar quando o SIP ainda está ativado, então isso também serve como confirmação de que a etapa 2 funcionou.

4. **Verifique a bridge a partir do OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   A entrada do iMessage deve relatar `works`, e `imsg status --json | jq '.selectors'` deve mostrar `retractMessagePart: true` além de quaisquer seletores de edição / digitação / leitura que sua build do macOS exponha. O gating por método do Plugin do OpenClaw em `actions.ts` só anuncia ações cujo seletor subjacente é `true`, então a superfície de ações que você vê na lista de ferramentas do agente reflete o que a bridge realmente consegue fazer neste host.

Se `openclaw channels status --probe` relatar o canal como `works`, mas ações específicas lançarem "iMessage `<action>` requires the imsg private API bridge" no momento do despacho, execute `imsg launch` novamente — o helper pode cair (reinício do Messages.app, atualização do SO etc.) e o status em cache `available: true` continuará anunciando ações até que a próxima sondagem atualize.

### Quando você não pode desativar o SIP

Se usar o SIP desativado não for aceitável para o seu modelo de ameaça:

- `imsg` faz fallback para o modo básico — apenas texto + mídia + recebimento.
- O Plugin do OpenClaw ainda anuncia envio de texto/mídia e monitoramento de entrada; ele apenas oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` e operações de grupo da superfície de ações (conforme o gate de capacidade por método).
- Você pode executar um Mac separado que não seja Apple Silicon (ou um Mac dedicado de bot) com o SIP desativado para a carga de trabalho do iMessage, mantendo o SIP ativado nos seus dispositivos principais. Veja [Usuário macOS dedicado para bot (identidade iMessage separada)](#deployment-patterns) abaixo.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` controla mensagens diretas:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    Campo de allowlist: `channels.imessage.allowFrom`.

    Entradas da allowlist devem identificar remetentes: handles ou grupos estáticos de acesso de remetente (`accessGroup:<name>`). Use `channels.imessage.groupAllowFrom` para destinos de chat como `chat_id:*`, `chat_guid:*` ou `chat_identifier:*`; use `channels.imessage.groups` para chaves numéricas de registro `chat_id`.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` controla o tratamento de grupos:

    - `allowlist` (padrão quando configurado)
    - `open`
    - `disabled`

    Allowlist de remetentes de grupo: `channels.imessage.groupAllowFrom`.

    Entradas de `groupAllowFrom` também podem referenciar grupos estáticos de acesso de remetente (`accessGroup:<name>`).

    Fallback em runtime: se `groupAllowFrom` não estiver definido, as verificações de remetente de grupo do iMessage usam `allowFrom`; defina `groupAllowFrom` quando a admissão de DMs e grupos deve ser diferente.
    Observação de runtime: se `channels.imessage` estiver completamente ausente, o runtime faz fallback para `groupPolicy="allowlist"` e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    <Warning>
    O roteamento de grupos tem **dois** gates de allowlist executados em sequência, e ambos precisam passar:

    1. **Allowlist de remetente / destino de chat** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` ou `chat_id`.
    2. **Registro de grupos** (`channels.imessage.groups`) — com `groupPolicy: "allowlist"`, esse gate exige uma entrada curinga `groups: { "*": { ... } }` (define `allowAll = true`) ou uma entrada explícita por `chat_id` em `groups`.

    Se o gate 2 não tiver nada, toda mensagem de grupo será descartada. O Plugin emite dois sinais de nível `warn` no nível de log padrão:

    - uma vez por conta na inicialização: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - uma vez por `chat_id` em runtime: `imessage: dropping group message from chat_id=<id> ...`

    DMs continuam funcionando porque seguem um caminho de código diferente.

    Configuração mínima para manter grupos fluindo com `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Se essas linhas `warn` aparecerem no log do gateway, o gate 2 está descartando — adicione o bloco `groups`.
    </Warning>

    Gating de menção para grupos:

    - o iMessage não tem metadados nativos de menção
    - a detecção de menção usa padrões regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - sem padrões configurados, o gating de menção não pode ser aplicado

    Comandos de controle de remetentes autorizados podem ignorar o gating de menção em grupos.

    `systemPrompt` por grupo:

    Cada entrada em `channels.imessage.groups.*` aceita uma string opcional `systemPrompt`. O valor é injetado no prompt de sistema do agente em todo turno que processa uma mensagem nesse grupo. A resolução espelha a resolução de prompt por grupo usada por `channels.whatsapp.groups`:

    1. **Prompt de sistema específico do grupo** (`groups["<chat_id>"].systemPrompt`): usado quando a entrada específica do grupo existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga é suprimido e nenhum prompt de sistema é aplicado a esse grupo.
    2. **Prompt de sistema curinga de grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está totalmente ausente do mapa, ou quando existe mas não define nenhuma chave `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompts por grupo só se aplicam a mensagens de grupo — mensagens diretas neste canal não são afetadas.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - Mensagens diretas usam roteamento direto; grupos usam roteamento de grupo.
    - Com o `session.dmScope=main` padrão, mensagens diretas do iMessage são agrupadas na sessão principal do agente.
    - Sessões de grupo são isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Respostas retornam ao iMessage usando metadados do canal/alvo de origem.

    Comportamento de conversas semelhantes a grupos:

    Algumas conversas do iMessage com vários participantes podem chegar com `is_group=false`.
    Se esse `chat_id` estiver configurado explicitamente em `channels.imessage.groups`, o OpenClaw o trata como tráfego de grupo (controle de grupo + isolamento de sessão de grupo).

  </Tab>
</Tabs>

## Vinculações de conversas ACP

Chats legados do iMessage também podem ser vinculados a sessões ACP.

Fluxo rápido para operador:

- Execute `/acp spawn codex --bind here` dentro da mensagem direta ou do chat de grupo permitido.
- Mensagens futuras nessa mesma conversa do iMessage são roteadas para a sessão ACP criada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove a vinculação.

Vinculações persistentes configuradas são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` pode usar:

- identificador normalizado de mensagem direta, como `+15555550123` ou `user@example.com`
- `chat_id:<id>` (recomendado para vinculações de grupo estáveis)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Exemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para o comportamento compartilhado de vinculação ACP.

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Use um ID Apple e um usuário macOS dedicados para que o tráfego do bot fique isolado do seu perfil pessoal do Mensagens.

    Fluxo típico:

    1. Crie/acesse um usuário macOS dedicado.
    2. Entre no Mensagens com o ID Apple do bot nesse usuário.
    3. Instale `imsg` nesse usuário.
    4. Crie um wrapper SSH para que o OpenClaw possa executar `imsg` no contexto desse usuário.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para esse perfil de usuário.

    A primeira execução pode exigir aprovações pela GUI (Automação + Acesso Total ao Disco) nessa sessão de usuário do bot.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topologia comum:

    - o gateway é executado em Linux/VM
    - iMessage + `imsg` é executado em um Mac na sua tailnet
    - o wrapper `cliPath` usa SSH para executar `imsg`
    - `remoteHost` habilita buscas de anexos via SCP

    Exemplo:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Use chaves SSH para que SSH e SCP sejam não interativos.
    Garanta que a chave do host seja confiável primeiro (por exemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja preenchido.

  </Accordion>

  <Accordion title="Multi-account pattern">
    O iMessage oferece suporte a configuração por conta em `channels.imessage.accounts`.

    Cada conta pode substituir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configurações de histórico e listas de permissão de raízes de anexos.

  </Accordion>

  <Accordion title="Direct-message history">
    Defina `channels.imessage.dmHistoryLimit` para preencher novas sessões de mensagem direta com o histórico recente decodificado do `imsg` dessa conversa. Use `channels.imessage.dms["<sender>"].historyLimit` para substituições por remetente, incluindo `0` para desabilitar o histórico de um remetente.

    O histórico de mensagens diretas do iMessage é buscado sob demanda no `imsg`. Deixar `dmHistoryLimit` indefinido desabilita o preenchimento global do histórico de mensagens diretas, mas um `channels.imessage.dms["<sender>"].historyLimit` positivo por remetente ainda habilita o preenchimento para esse remetente.

  </Accordion>
</AccordionGroup>

## Mídia, fragmentação e alvos de entrega

<AccordionGroup>
  <Accordion title="Anexos e mídia">
    - a ingestão de anexos de entrada fica **desativada por padrão** — defina `channels.imessage.includeAttachments: true` para encaminhar fotos, memorandos de voz, vídeo e outros anexos ao agente. Com isso desativado, iMessages que contêm apenas anexos são descartadas antes de chegar ao agente e podem não produzir nenhuma linha de log `Inbound message`.
    - caminhos de anexos remotos podem ser buscados via SCP quando `remoteHost` estiver definido
    - caminhos de anexos devem corresponder às raízes permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - padrão de raiz padrão: `/Users/*/Library/Messages/Attachments`
    - SCP usa verificação rigorosa de chave de host (`StrictHostKeyChecking=yes`)
    - o tamanho de mídia de saída usa `channels.imessage.mediaMaxMb` (padrão 16 MB)

  </Accordion>

  <Accordion title="Divisão de saída em partes">
    - limite de parte de texto: `channels.imessage.textChunkLimit` (padrão 4000)
    - modo de divisão em partes: `channels.imessage.chunkMode`
      - `length` (padrão)
      - `newline` (divisão priorizando parágrafos)

  </Accordion>

  <Accordion title="Formatos de endereçamento">
    Destinos explícitos preferenciais:

    - `chat_id:123` (recomendado para roteamento estável)
    - `chat_guid:...`
    - `chat_identifier:...`

    Destinos por identificador também são compatíveis:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Ações de API privada

Quando `imsg launch` estiver em execução e `openclaw channels status --probe` informar `privateApi.available: true`, a ferramenta de mensagens poderá usar ações nativas do iMessage além dos envios normais de texto.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ações disponíveis">
    - **react**: Adicione/remova tapbacks do iMessage (`messageId`, `emoji`, `remove`). Tapbacks compatíveis são mapeados para amor, curtir, não curtir, rir, enfatizar e pergunta.
    - **reply**: Envie uma resposta encadeada para uma mensagem existente (`messageId`, `text` ou `message`, além de `chatGuid`, `chatId`, `chatIdentifier` ou `to`).
    - **sendWithEffect**: Envie texto com um efeito do iMessage (`text` ou `message`, `effect` ou `effectId`).
    - **edit**: Edite uma mensagem enviada em versões compatíveis do macOS/API privada (`messageId`, `text` ou `newText`).
    - **unsend**: Retraia uma mensagem enviada em versões compatíveis do macOS/API privada (`messageId`).
    - **upload-file**: Envie mídia/arquivos (`buffer` como base64 ou um `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias legado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gerencie chats em grupo quando o destino atual for uma conversa em grupo.

  </Accordion>

  <Accordion title="IDs de mensagem">
    O contexto de entrada do iMessage inclui tanto valores curtos de `MessageSid` quanto GUIDs completos de mensagem quando disponíveis. IDs curtos são escopados ao cache recente de respostas baseado em SQLite e são verificados contra o chat atual antes do uso. Se um ID curto expirou ou pertence a outro chat, tente novamente com o `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Detecção de capacidade">
    O OpenClaw oculta ações de API privada somente quando o status de sondagem em cache diz que a ponte está indisponível. Se o status for desconhecido, as ações permanecem visíveis e o despacho faz sondagens de forma preguiçosa para que a primeira ação possa ter sucesso após `imsg launch` sem uma atualização manual de status separada.

  </Accordion>

  <Accordion title="Recibos de leitura e digitação">
    Quando a ponte de API privada está ativa, chats de entrada aceitos são marcados como lidos e chats diretos mostram uma bolha de digitação assim que o turno é aceito, enquanto o agente prepara o contexto e gera. Desative a marcação como lido com:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Builds mais antigas do `imsg`, anteriores à lista de capacidades por método, desativarão digitação/leitura silenciosamente; o OpenClaw registra um aviso único por reinicialização para que o recibo ausente seja atribuível.

  </Accordion>

  <Accordion title="Tapbacks de entrada">
    O OpenClaw assina tapbacks do iMessage e roteia reações aceitas como eventos de sistema em vez de texto de mensagem normal, portanto um tapback de usuário não aciona um ciclo comum de resposta.

    O modo de notificação é controlado por `channels.imessage.reactionNotifications`:

    - `"own"` (padrão): notifique somente quando usuários reagirem a mensagens escritas pelo bot.
    - `"all"`: notifique para todos os tapbacks de entrada de remetentes autorizados.
    - `"off"`: ignore tapbacks de entrada.

    Substituições por conta usam `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reações de aprovação (👍 / 👎)">
    Quando `approvals.exec.enabled` ou `approvals.plugin.enabled` for true e a solicitação for roteada para o iMessage, o Gateway entrega um prompt de aprovação nativamente e aceita um tapback para resolvê-lo:

    - `👍` (tapback Curtir) → `allow-once`
    - `👎` (tapback Não curtir) → `deny`
    - `allow-always` continua sendo um fallback manual: envie `/approve <id> allow-always` como uma resposta regular.

    O tratamento de reações exige que o identificador do usuário que reagiu seja um aprovador explícito. A lista de aprovadores é lida de `channels.imessage.allowFrom` (ou `channels.imessage.accounts.<id>.allowFrom`); adicione o número de telefone do usuário no formato E.164 ou o e-mail do Apple ID dele. A entrada curinga `"*"` é honrada, mas permite que qualquer remetente aprove. O atalho de reação ignora intencionalmente `reactionNotifications`, `dmPolicy` e `groupAllowFrom` porque a lista de permissão de aprovadores explícitos é o único gate que importa para a resolução de aprovação.

    **Mudança de comportamento nesta versão:** Quando `channels.imessage.allowFrom` não estiver vazio, o comando de texto `/approve <id> <decision>` agora é autorizado contra essa lista de aprovadores (não a lista de permissão de DM mais ampla). Remetentes permitidos na lista de permissão de DM, mas não em `allowFrom`, receberão uma negação explícita. Adicione todo operador que deve poder aprovar via `/approve` (e via reações) a `allowFrom` para preservar o comportamento anterior. Quando `allowFrom` estiver vazio, o "fallback de mesmo chat" legado permanece em vigor e `/approve` continua autorizando qualquer pessoa permitida pela lista de permissão de DM.

    Observações para operadores:
    - A associação da reação é armazenada tanto em memória (com TTL correspondente à expiração da aprovação) quanto no armazenamento persistente com chave do gateway, de modo que um tapback que chegar logo após uma reinicialização do gateway ainda resolverá a aprovação.
    - Tapbacks entre dispositivos com `is_from_me=true` (a própria reação do operador em um dispositivo Apple emparelhado) são ignorados intencionalmente para que o bot não possa se autoaprovar.
    - Tapbacks legados em estilo de texto (`Liked "…"` em texto simples de clientes Apple muito antigos) não podem resolver aprovações porque não carregam GUID de mensagem; a resolução de reações exige os metadados estruturados de tapback emitidos por clientes macOS / iOS atuais.

  </Accordion>
</AccordionGroup>

## Escritas de configuração

O iMessage permite escritas de configuração iniciadas pelo canal por padrão (para `/config set|unset` quando `commands.config: true`).

Desativar:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescência de DMs com envio dividido (comando + URL em uma composição)

Quando um usuário digita um comando e uma URL juntos — por exemplo, `Dump https://example.com/article` — o app Mensagens da Apple divide o envio em **duas linhas `chat.db` separadas**:

1. Uma mensagem de texto (`"Dump"`).
2. Um balão de pré-visualização de URL (`"https://..."`) com imagens de pré-visualização OG como anexos.

As duas linhas chegam ao OpenClaw com ~0,8-2,0 s de intervalo na maioria das configurações. Sem coalescência, o agente recebe o comando sozinho no turno 1, responde (frequentemente "envie-me a URL") e só vê a URL no turno 2 — momento em que o contexto do comando já foi perdido. Esse é o pipeline de envio da Apple, não algo introduzido pelo OpenClaw ou pelo `imsg`.

`channels.imessage.coalesceSameSenderDms` opta uma DM para armazenar em buffer linhas consecutivas do mesmo remetente. Quando `imsg` expõe o marcador estrutural de pré-visualização de URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` em uma das linhas de origem, o OpenClaw mescla somente esse envio dividido real e mantém quaisquer outras linhas em buffer como turnos separados. Em builds mais antigas do `imsg` que não emitem metadados de balão, o OpenClaw não consegue distinguir um envio dividido de envios separados, então ele recorre à mesclagem do bucket. Isso preserva o comportamento anterior aos metadados em vez de regredir envios divididos de `Dump <url>` para dois turnos. Chats em grupo continuam sendo despachados por mensagem para preservar a estrutura de turnos com múltiplos usuários.

<Tabs>
  <Tab title="Quando ativar">
    Ative quando:

    - Você distribui skills que esperam `command + payload` em uma mensagem (dump, paste, save, queue etc.).
    - Seus usuários colam URLs junto com comandos.
    - Você pode aceitar a latência adicional de turno de DM (veja abaixo).

    Deixe desativado quando:

    - Você precisa de latência mínima de comando para gatilhos de DM de uma única palavra.
    - Todos os seus fluxos são comandos de uma etapa sem acompanhamentos de payload.

  </Tab>
  <Tab title="Ativação">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // optar por ativar (padrão: false)
        },
      },
    }
    ```

    Com a flag ativada e sem `messages.inbound.byChannel.imessage` explícito nem `messages.inbound.debounceMs` global, a janela de debounce aumenta para **7000 ms** (o padrão legado é 0 ms — sem debounce). A janela mais ampla é necessária porque a cadência de envio dividido da pré-visualização de URL da Apple pode se estender por vários segundos enquanto o Messages.app emite a linha de pré-visualização.

    Para ajustar a janela por conta própria:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms cobre atrasos observados de pré-visualização de URL do Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **A mesclagem precisa requer metadados atuais de payload do `imsg`.** Quando a linha de URL inclui `balloon_bundle_id`, somente esse envio dividido real é mesclado e outras linhas em buffer permanecem separadas. Em builds mais antigas do `imsg` que não expõem metadados de balão, o OpenClaw recorre à mesclagem do bucket em buffer para que envios divididos de `Dump <url>` não regressem para dois turnos (compatibilidade retroativa temporária, removida assim que `imsg` coalescer envios divididos upstream).
    - **Latência adicionada para mensagens de DM.** Com a flag ativada, toda DM (incluindo comandos de controle independentes e acompanhamentos de texto único) espera até a janela de debounce antes de despachar, caso uma linha de pré-visualização de URL esteja chegando. Mensagens de chat em grupo mantêm despacho instantâneo.
    - **A saída mesclada é limitada.** O texto mesclado é limitado a 4000 caracteres com um marcador explícito `…[truncated]`; anexos são limitados a 20; entradas de origem são limitadas a 10 (primeira-mais-recente retidas além disso). Cada GUID de origem é rastreado em `coalescedMessageGuids` para telemetria downstream.
    - **Somente DM.** Chats em grupo passam para despacho por mensagem para que o bot permaneça responsivo quando várias pessoas estão digitando.
    - **Opt-in, por canal.** Outros canais (Telegram, WhatsApp, Slack, …) não são afetados. Configurações legadas do BlueBubbles que definem `channels.bluebubbles.coalesceSameSenderDms` devem migrar esse valor para `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Cenários e o que o agente vê

A coluna "Flag on" mostra o comportamento em uma build `imsg` que emite `balloon_bundle_id`. Em builds `imsg` mais antigas que não emitem nenhum metadado de balão, as linhas abaixo marcadas como "Dois turnos" / "N turnos" retornam, em vez disso, para uma mesclagem legada (um turno): o OpenClaw não consegue distinguir estruturalmente um envio dividido de envios separados, então preserva a mesclagem anterior aos metadados. A separação precisa é ativada quando a build passa a emitir metadados de balão.

| Usuário compõe                                                    | `chat.db` produz                    | Flag off (padrão)                         | Flag on + janela (`imsg` emite metadados de balão)                                                        |
| ----------------------------------------------------------------- | ----------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (um envio)                             | 2 linhas com ~1 s de intervalo      | Dois turnos do agente: "Dump" sozinho, depois URL | Um turno: texto mesclado `Dump https://example.com`                                                       |
| `Save this 📎image.jpg caption` (anexo + texto)                   | 2 linhas sem metadados de balão de URL | Dois turnos                               | Dois turnos depois que metadados são observados; um turno mesclado em sessões antigas/pré-latch sem metadados |
| `/status` (comando independente)                                  | 1 linha                             | Despacho instantâneo                      | **Aguardar até a janela e então despachar**                                                               |
| URL colada sozinha                                                | 1 linha                             | Despacho instantâneo                      | Aguardar até a janela e então despachar                                                                   |
| Texto + URL enviados como duas mensagens separadas deliberadas, com minutos de diferença | 2 linhas fora da janela             | Dois turnos                               | Dois turnos (a janela expira entre eles)                                                                  |
| Enxurrada rápida (>10 DMs pequenas dentro da janela)              | N linhas sem metadados de balão de URL | N turnos                                  | N turnos depois que metadados são observados; um turno mesclado delimitado em sessões antigas/pré-latch sem metadados |
| Duas pessoas digitando em um chat em grupo                        | N linhas de M remetentes            | M+ turnos (um por bucket de remetente)    | M+ turnos — chats em grupo não são coalescidos                                                            |

## Recuperação de entrada após uma reinicialização da ponte ou do gateway

O iMessage recupera mensagens perdidas enquanto o gateway estava fora do ar e, ao mesmo tempo, suprime a "bomba de backlog" obsoleta que a Apple pode liberar após uma recuperação Push. O comportamento padrão está sempre ativo, construído sobre a deduplicação de entrada.

- **Deduplicação de replay.** Toda mensagem de entrada despachada é registrada por seu GUID da Apple no estado persistente do plugin (`imessage.inbound-dedupe`), reivindicada na ingestão e confirmada após o tratamento (liberada em uma falha transitória para que possa tentar novamente). Qualquer coisa já tratada é descartada em vez de despachada duas vezes. É isso que permite que a recuperação faça replay agressivamente sem escrituração por mensagem.
- **Recuperação de indisponibilidade.** Na inicialização, o monitor lembra o último rowid despachado de `chat.db` (um cursor por conta persistido) e o passa para `imsg watch.subscribe` como `since_rowid`, para que o imsg reproduza as linhas que chegaram enquanto o gateway estava fora do ar e então siga em tempo real. O replay é limitado às linhas mais recentes e a mensagens de até ~2 horas atrás, e a deduplicação descarta qualquer coisa já tratada.
- **Limite de idade de backlog obsoleto.** Linhas acima do limite de inicialização são genuinamente em tempo real; uma cujo horário de envio é mais de ~15 minutos anterior à chegada é o backlog de flush do Push e é suprimida. Linhas reproduzidas (no limite ou abaixo dele) usam a janela de recuperação mais ampla, para que uma mensagem perdida recentemente seja entregue enquanto histórico antigo não seja.

A recuperação funciona em configurações `cliPath` locais e remotas, porque o replay `since_rowid` roda pela mesma conexão RPC do `imsg`. A diferença é a janela: quando o gateway consegue ler `chat.db` (local), ele ancora o limite de rowid de inicialização, limita o intervalo de replay e entrega mensagens perdidas de até algumas horas atrás. Por um `cliPath` SSH remoto, ele não consegue ler o banco de dados, então o replay não é limitado e cada linha usa o limite de idade em tempo real — ele ainda recupera mensagens perdidas recentemente e ainda suprime backlog antigo, apenas com a janela em tempo real mais estreita. Execute o gateway no Mac do Mensagens para obter a janela de recuperação mais ampla.

### Sinal visível ao operador

Backlog suprimido é registrado no nível padrão, nunca descartado silenciosamente (a flag `recovery` mostra qual janela foi aplicada):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migração

`channels.imessage.catchup.*` está obsoleto — a recuperação de indisponibilidade agora é automática e não precisa de configuração para novas instalações. Configurações existentes com `catchup.enabled: true` continuam sendo respeitadas como um perfil de compatibilidade para a janela de replay de recuperação. Blocos catchup desabilitados (`enabled: false` ou sem `enabled: true`) foram aposentados; `openclaw doctor --fix` os remove.

## Solução de problemas

<AccordionGroup>
  <Accordion title="imsg não encontrado ou RPC sem suporte">
    Valide o binário e o suporte a RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Se a sondagem relatar RPC sem suporte, atualize `imsg`. Se ações de API privada estiverem indisponíveis, execute `imsg launch` na sessão do usuário macOS conectado e sonde novamente. Se o Gateway não estiver rodando no macOS, use a configuração de Mac remoto por SSH acima em vez do caminho `imsg` local padrão.

  </Accordion>

  <Accordion title="Mensagens são enviadas, mas iMessages de entrada não chegam">
    Primeiro prove se a mensagem chegou ao Mac local. Se `chat.db` não mudar, o OpenClaw não consegue receber a mensagem mesmo quando `imsg status --json` relata uma ponte saudável.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Se mensagens enviadas pelo telefone não criarem novas linhas, repare a camada Mensagens do macOS e Apple Push antes de alterar a configuração do OpenClaw. Uma atualização única do serviço costuma ser suficiente:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envie um iMessage novo do telefone e confirme uma nova linha em `chat.db` ou um evento `imsg watch` antes de depurar sessões do OpenClaw. Não execute isso como um loop periódico de reinicialização da ponte; `imsg launch` repetido mais reinicializações do gateway durante trabalho ativo podem interromper entregas e deixar execuções de canal em andamento paradas.

  </Accordion>

  <Accordion title="Gateway não está rodando no macOS">
    O `cliPath: "imsg"` padrão deve rodar no Mac conectado ao Mensagens. No Linux ou Windows, defina `channels.imessage.cliPath` como um script wrapper que faz SSH para esse Mac e executa `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Então execute:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs são ignoradas">
    Verifique:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprovações de pareamento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Mensagens de grupo são ignoradas">
    Verifique:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento da lista de permissões `channels.imessage.groups`
    - configuração de padrões de menção (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Anexos remotos falham">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticação por chave SSH/SCP a partir do host do gateway
    - a chave de host existe em `~/.ssh/known_hosts` no host do gateway
    - legibilidade do caminho remoto no Mac que roda o Mensagens

  </Accordion>

  <Accordion title="Prompts de permissão do macOS foram perdidos">
    Execute novamente em um terminal GUI interativo no mesmo contexto de usuário/sessão e aprove os prompts:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirme que Acesso Total ao Disco + Automação estão concedidos para o contexto de processo que executa OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Ponteiros de referência de configuração

- [Referência de configuração - iMessage](/pt-BR/gateway/config-channels#imessage)
- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Pareamento](/pt-BR/channels/pairing)

## Relacionado

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Remoção do BlueBubbles e o caminho iMessage do imsg](/pt-BR/announcements/bluebubbles-imessage) — anúncio e resumo da migração
- [Vindo do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) — tabela de tradução de configuração e transição passo a passo
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança

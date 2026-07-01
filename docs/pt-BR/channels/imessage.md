---
read_when:
    - Configurando o suporte ao iMessage
    - Depuração de envio/recebimento do iMessage
summary: Suporte nativo ao iMessage via imsg (JSON-RPC sobre stdio), com ações de API privada para respostas, tapbacks, efeitos, enquetes, anexos e gerenciamento de grupos. Preferido para novas configurações de iMessage do OpenClaw quando os requisitos do host forem adequados.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T12:51:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para implantações do OpenClaw iMessage, use `imsg` em um host macOS Messages com sessão iniciada. Se o seu Gateway roda em Linux ou Windows, aponte `channels.imessage.cliPath` para um wrapper SSH que execute `imsg` no Mac.

**A recuperação de entrada é automática.** Após uma reinicialização da ponte ou do gateway, o iMessage reproduz as mensagens perdidas enquanto estava fora do ar e suprime a "bomba de backlog" obsoleta que a Apple pode despejar após uma recuperação de Push, deduplicando para que nada seja despachado duas vezes. Não há configuração a habilitar — consulte [Recuperação de entrada após uma reinicialização da ponte ou do gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
O suporte ao BlueBubbles foi removido. Migre configurações `channels.bluebubbles` para `channels.imessage`; o OpenClaw oferece suporte ao iMessage somente por meio de `imsg`. Comece com [Remoção do BlueBubbles e o caminho imsg para iMessage](/pt-BR/announcements/bluebubbles-imessage) para o anúncio curto, ou [Vindo do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) para a tabela de migração completa.
</Warning>

Status: integração nativa com CLI externa. O Gateway inicia `imsg rpc` e se comunica por JSON-RPC em stdio (sem daemon/porta separado). Ações avançadas exigem `imsg launch` e uma sondagem bem-sucedida da API privada.

<CardGroup cols={3}>
  <Card title="Ações da API privada" icon="wand-sparkles" href="#private-api-actions">
    Respostas, tapbacks, efeitos, enquetes, anexos e gerenciamento de grupos.
  </Card>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    DMs do iMessage usam modo de pareamento por padrão.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Use um wrapper SSH quando o Gateway não estiver em execução no Mac do Messages.
  </Card>
  <Card title="Referência de configuração" icon="settings" href="/pt-BR/gateway/config-channels#imessage">
    Referência completa dos campos do iMessage.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Mac local (caminho rápido)">
    <Steps>
      <Step title="Instale e verifique imsg">

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

  <Tab title="Mac remoto via SSH">
    O OpenClaw exige apenas um `cliPath` compatível com stdio, então você pode apontar `cliPath` para um script wrapper que faz SSH para um Mac remoto e executa `imsg`.

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
      remoteHost: "user@gateway-host", // usado para buscas de anexos por SCP
      includeAttachments: true,
      // Opcional: sobrescreve as raízes de anexos permitidas.
      // Os padrões incluem /Users/*/Library/Messages/Attachments
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
Qualquer wrapper `cliPath` ou proxy SSH que você coloque na frente de `imsg` DEVE se comportar como um pipe stdio transparente para JSON-RPC de longa duração. O OpenClaw troca pequenas mensagens JSON-RPC delimitadas por novas linhas pelo stdin/stdout do wrapper durante toda a vida útil do canal:

- Encaminhe cada bloco/linha de stdin **assim que bytes estiverem disponíveis** — não espere por EOF.
- Encaminhe cada bloco/linha de stdout prontamente na direção inversa.
- Preserve novas linhas.
- Evite leituras bloqueantes de tamanho fixo (`read(4096)`, `cat | buffer`, `read` padrão do shell) que podem deixar pequenos frames sem processamento.
- Mantenha stderr separado do fluxo stdout de JSON-RPC.

Um wrapper que armazena stdin em buffer até que um bloco grande seja preenchido produzirá sintomas que parecem uma indisponibilidade do iMessage — `imsg rpc timeout (chats.list)` ou reinicializações repetidas do canal — mesmo que o próprio `imsg rpc` esteja saudável. `ssh -T host imsg "$@"` (acima) é seguro porque encaminha os argumentos de `cliPath` do OpenClaw, como `rpc` e `--db`. Pipelines como `ssh host imsg | grep -v '^DEBUG'` NÃO são seguros — ferramentas com buffer por linha ainda podem reter frames; use `stdbuf -oL -eL` em cada estágio se precisar filtrar.
</Warning>

  </Tab>
</Tabs>

## Requisitos e permissões (macOS)

- O Messages deve estar com sessão iniciada no Mac que executa `imsg`.
- Acesso Total ao Disco é obrigatório para o contexto de processo que executa OpenClaw/`imsg` (acesso ao banco de dados do Messages).
- Permissão de Automação é obrigatória para enviar mensagens por meio do Messages.app.
- Para ações avançadas (reagir / editar / desfazer envio / resposta em thread / efeitos / enquetes / operações de grupo), a Proteção de Integridade do Sistema deve ser desativada — consulte [Habilitando a API privada do imsg](#enabling-the-imsg-private-api) abaixo. Envio/recebimento básico de texto e mídia funciona sem isso.

<Tip>
Permissões são concedidas por contexto de processo. Se o gateway roda headless (LaunchAgent/SSH), execute um comando interativo uma única vez nesse mesmo contexto para acionar os prompts:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Envios por wrapper SSH falham com AppleEvents -1743">
  Uma configuração por SSH remoto pode ler chats, passar em `channels status --probe` e processar mensagens de entrada, enquanto envios de saída ainda falham com um erro de autorização do AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Verifique o banco de dados TCC do usuário do Mac com sessão iniciada ou Ajustes do Sistema > Privacidade e Segurança > Automação. Se a entrada de Automação estiver registrada para `/usr/libexec/sshd-keygen-wrapper` em vez do processo `imsg` ou do shell local, o macOS pode não expor um seletor utilizável do Messages para esse cliente do lado do servidor SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Nesse estado, repetir `tccutil reset AppleEvents` ou executar novamente `imsg send` pelo mesmo wrapper SSH pode continuar falhando porque o contexto de processo que precisa da Automação do Messages é o wrapper SSH, não um app ao qual a UI possa conceder permissão.

Use um dos contextos de processo `imsg` compatíveis em vez disso:

- Execute o Gateway, ou pelo menos a ponte `imsg`, na sessão local do usuário do Messages com login ativo.
- Inicie o Gateway com um LaunchAgent para esse usuário após conceder Acesso Total ao Disco e Automação a partir da mesma sessão.
- Se você mantiver a topologia SSH de dois usuários, verifique se um `imsg send` real de saída funciona pelo wrapper exato antes de habilitar o canal. Se a Automação não puder ser concedida, reconfigure para uma instalação `imsg` de usuário único em vez de depender do wrapper SSH para envios.

</Accordion>

## Habilitando a API privada do imsg

`imsg` é distribuído em dois modos operacionais:

- **Modo básico** (padrão, sem necessidade de alterações no SIP): texto e mídia de saída via `send`, observação/histórico de entrada, lista de chats. Isso é o que você obtém de imediato com uma instalação nova via `brew install steipete/tap/imsg` mais as permissões padrão do macOS acima.
- **Modo de API privada**: `imsg` injeta uma dylib auxiliar no `Messages.app` para chamar funções internas do `IMCore`. Isso desbloqueia `react`, `edit`, `unsend`, `reply` (em thread), `sendWithEffect`, `poll` e `poll-vote` (enquetes nativas do Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, além de indicadores de digitação e recibos de leitura.

Para acessar a superfície de ações avançadas que esta página do canal documenta, você precisa do modo de API privada. O README do `imsg` é explícito sobre o requisito:

> Recursos avançados como `read`, `typing`, `launch`, envio rico com suporte de ponte, mutação de mensagens e gerenciamento de chats são opcionais. Eles exigem que o SIP esteja desativado e que uma dylib auxiliar seja injetada no `Messages.app`. `imsg launch` se recusa a injetar quando o SIP está habilitado.

A técnica de injeção do auxiliar usa a própria dylib do `imsg` para acessar APIs privadas do Messages. Não há servidor de terceiros nem runtime BlueBubbles no caminho iMessage do OpenClaw.

<Warning>
**Desativar o SIP é uma troca de segurança real.** O SIP é uma das proteções centrais do macOS contra execução de código de sistema modificado; desativá-lo em todo o sistema abre superfície de ataque adicional e efeitos colaterais. Em especial, **desativar o SIP em Macs Apple Silicon também desativa a capacidade de instalar e executar apps iOS no seu Mac**.

Trate isso como uma escolha operacional deliberada, não como padrão. Se o seu modelo de ameaças não tolera o SIP desativado, o iMessage integrado fica limitado ao modo básico — apenas envio/recebimento de texto e mídia, sem reações / edição / desfazer envio / efeitos / operações de grupo.
</Warning>

### Configuração

1. **Instale (ou atualize) `imsg`** no Mac que executa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   A saída de `imsg status --json` relata `bridge_version`, `rpc_methods` e `selectors` por método, para que você veja o que a build atual oferece suporte antes de começar.

2. **Desative a Proteção de Integridade do Sistema e, (no macOS moderno) a Validação de Biblioteca.** Injetar uma dylib auxiliar não Apple no `Messages.app` assinado pela Apple exige SIP desativado **e** validação de biblioteca relaxada. A etapa de SIP no modo de Recuperação é específica da versão do macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** desative a Validação de Biblioteca pelo Terminal, reinicie no Modo de Recuperação, execute `csrutil disable`, reinicie.
   - **macOS 11+ (Big Sur e posterior), Intel:** Modo de Recuperação (ou Recuperação pela Internet), `csrutil disable`, reinicie.
   - **macOS 11+, Apple Silicon:** sequência de inicialização pelo botão liga/desliga para entrar em Recuperação; em versões recentes do macOS, mantenha pressionada a tecla **Shift Esquerdo** ao clicar em Continuar, depois `csrutil disable`. Configurações de máquina virtual seguem um fluxo separado, então faça primeiro um snapshot da VM.

   **No macOS 11 e posteriores, apenas `csrutil disable` geralmente não é suficiente.** A Apple ainda aplica validação de biblioteca contra o `Messages.app` como binário de plataforma, então um auxiliar assinado ad hoc é rejeitado (`Library Validation failed: ... platform binary, but mapped file is not`) mesmo com SIP desativado. Após desativar o SIP, também desative a validação de biblioteca e reinicie:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificado na 26.5.1:** SIP desativado **mais** o comando `DisableLibraryValidation` acima é suficiente para injetar o auxiliar da 26.0 até a 26.5.x. **Nenhum boot-arg é necessário.** O plist é o fator decisivo e a etapa ausente mais comum quando a injeção falha no Tahoe:
   - **Com o plist:** `imsg launch` injeta e `imsg status` relata `advanced_features: true`.
   - **Sem o plist (mesmo com SIP desativado):** `imsg launch` falha com `Failed to launch: Timeout waiting for Messages.app to initialize`. O AMFI rejeita o auxiliar ad hoc no carregamento, então a ponte nunca fica pronta e o lançamento expira. Esse timeout é o sintoma que a maioria das pessoas encontra no Tahoe, e a correção é o plist acima, não algo mais drástico.

   Isso foi confirmado com um antes/depois controlado no macOS 26.5.1 (Apple Silicon): com o plist, a dylib é mapeada no `Messages.app` e a ponte sobe; remova o plist e reinicie, e `imsg launch` produz a falha de timeout acima, com a dylib não mapeada.

   Se a injeção de `imsg launch` ou `selectors` específicos começarem a retornar falso após uma atualização do macOS, esse gate geralmente é a causa. Verifique o estado do SIP e da validação de biblioteca antes de presumir que a própria etapa do SIP falhou. Se essas configurações estiverem corretas e a ponte ainda não conseguir injetar, colete `imsg status --json` mais a saída de `imsg launch` e relate ao projeto `imsg` em vez de enfraquecer controles adicionais de segurança em todo o sistema.

   Siga o fluxo em modo de Recuperação da Apple para seu Mac para desabilitar o SIP antes de executar `imsg launch`.

3. **Injete o auxiliar.** Com o SIP desabilitado e o Messages.app conectado:

   ```bash
   imsg launch
   ```

   `imsg launch` se recusa a injetar quando o SIP ainda está habilitado, então isso também serve como confirmação de que a etapa 2 funcionou.

4. **Verifique a ponte a partir do OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   A entrada do iMessage deve relatar `works`, e `imsg status --json | jq '{rpc_methods, selectors}'` deve mostrar as capacidades expostas pela sua compilação do macOS. A criação de enquetes exige `selectors.pollPayloadMessage`; a votação exige tanto `selectors.pollVoteMessage` quanto o método RPC `poll.vote`. O Plugin do OpenClaw anuncia apenas ações compatíveis com a sondagem em cache, enquanto um cache vazio permanece otimista e sonda no primeiro envio.

Se `openclaw channels status --probe` relatar o canal como `works`, mas ações específicas gerarem "iMessage `<action>` requires the imsg private API bridge" no momento do envio, execute `imsg launch` novamente — o auxiliar pode sair de operação (reinicialização do Messages.app, atualização do SO etc.) e o status em cache `available: true` continuará anunciando ações até que a próxima sondagem atualize.

### Quando você não pode desabilitar o SIP

Se SIP desabilitado não for aceitável para seu modelo de ameaças:

- `imsg` volta para o modo básico — texto + mídia + recebimento apenas.
- O Plugin do OpenClaw ainda anuncia envio de texto/mídia e monitoramento de entrada; ele apenas oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` e operações de grupo da superfície de ações (conforme o gate de capacidade por método).
- Você pode executar um Mac separado que não seja Apple Silicon (ou um Mac dedicado para bot) com SIP desativado para a carga de trabalho do iMessage, mantendo o SIP habilitado nos seus dispositivos principais. Veja [Usuário macOS dedicado para bot (identidade iMessage separada)](#deployment-patterns) abaixo.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.imessage.dmPolicy` controla mensagens diretas:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    Campo da lista de permissões: `channels.imessage.allowFrom`.

    Entradas da lista de permissões devem identificar remetentes: identificadores ou grupos estáticos de acesso de remetente (`accessGroup:<name>`). Use `channels.imessage.groupAllowFrom` para alvos de chat como `chat_id:*`, `chat_guid:*` ou `chat_identifier:*`; use `channels.imessage.groups` para chaves numéricas de registro `chat_id`.

  </Tab>

  <Tab title="Política de grupo + menções">
    `channels.imessage.groupPolicy` controla o tratamento de grupos:

    - `allowlist` (padrão quando configurado)
    - `open`
    - `disabled`

    Lista de permissões de remetentes de grupo: `channels.imessage.groupAllowFrom`.

    Entradas de `groupAllowFrom` também podem referenciar grupos estáticos de acesso de remetente (`accessGroup:<name>`).

    Fallback em tempo de execução: se `groupAllowFrom` não estiver definido, as verificações de remetente de grupo do iMessage usam `allowFrom`; defina `groupAllowFrom` quando a admissão de DMs e grupos precisar ser diferente.
    Observação de tempo de execução: se `channels.imessage` estiver completamente ausente, o runtime volta para `groupPolicy="allowlist"` e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    <Warning>
    O roteamento de grupos tem **dois** gates de lista de permissões executados em sequência, e ambos devem passar:

    1. **Lista de permissões de remetente / alvo de chat** (`channels.imessage.groupAllowFrom`) — identificador, `chat_guid`, `chat_identifier` ou `chat_id`.
    2. **Registro de grupos** (`channels.imessage.groups`) — com `groupPolicy: "allowlist"`, este gate exige uma entrada curinga `groups: { "*": { ... } }` (define `allowAll = true`) ou uma entrada explícita por `chat_id` em `groups`.

    Se o gate 2 não tiver nada, todas as mensagens de grupo serão descartadas. O Plugin emite dois sinais de nível `warn` no nível de log padrão:

    - uma vez por conta na inicialização: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - uma vez por `chat_id` em tempo de execução: `imessage: dropping group message from chat_id=<id> ...`

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

    Gate de menções para grupos:

    - iMessage não tem metadados nativos de menção
    - a detecção de menções usa padrões regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - sem padrões configurados, o gate de menções não pode ser imposto

    Comandos de controle de remetentes autorizados podem ignorar o gate de menções em grupos.

    `systemPrompt` por grupo:

    Cada entrada em `channels.imessage.groups.*` aceita uma string opcional `systemPrompt`. O valor é injetado no prompt de sistema do agente em cada turno que trata uma mensagem nesse grupo. A resolução espelha a resolução de prompt por grupo usada por `channels.whatsapp.groups`:

    1. **Prompt de sistema específico do grupo** (`groups["<chat_id>"].systemPrompt`): usado quando a entrada específica do grupo existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga é suprimido e nenhum prompt de sistema é aplicado a esse grupo.
    2. **Prompt de sistema curinga de grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está totalmente ausente do mapa, ou quando ela existe mas não define nenhuma chave `systemPrompt`.

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

    Prompts por grupo se aplicam apenas a mensagens de grupo — mensagens diretas neste canal não são afetadas.

  </Tab>

  <Tab title="Sessões e respostas determinísticas">
    - DMs usam roteamento direto; grupos usam roteamento de grupo.
    - Com `session.dmScope=main` padrão, DMs do iMessage são agrupadas na sessão principal do agente.
    - Sessões de grupo são isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Respostas são roteadas de volta para o iMessage usando metadados de canal/alvo de origem.

    Comportamento de thread parecido com grupo:

    Algumas threads do iMessage com vários participantes podem chegar com `is_group=false`.
    Se esse `chat_id` estiver explicitamente configurado em `channels.imessage.groups`, o OpenClaw o trata como tráfego de grupo (gate de grupo + isolamento de sessão de grupo).

  </Tab>
</Tabs>

## Associações de conversa ACP

Chats legados do iMessage também podem ser associados a sessões ACP.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat em grupo permitido.
- Mensagens futuras nessa mesma conversa do iMessage são roteadas para a sessão ACP criada.
- `/new` e `/reset` redefinem a mesma sessão ACP associada no lugar.
- `/acp close` fecha a sessão ACP e remove a associação.

Associações persistentes configuradas são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` pode usar:

- identificador de DM normalizado como `+15555550123` ou `user@example.com`
- `chat_id:<id>` (recomendado para associações de grupo estáveis)
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

Veja [Agentes ACP](/pt-BR/tools/acp-agents) para o comportamento compartilhado de associação ACP.

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Usuário macOS dedicado para bot (identidade iMessage separada)">
    Use um Apple ID dedicado e um usuário macOS para que o tráfego do bot fique isolado do seu perfil pessoal do Messages.

    Fluxo típico:

    1. Crie/entre em um usuário macOS dedicado.
    2. Entre no Messages com o Apple ID do bot nesse usuário.
    3. Instale `imsg` nesse usuário.
    4. Crie um wrapper SSH para que o OpenClaw possa executar `imsg` no contexto desse usuário.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para esse perfil de usuário.

    A primeira execução pode exigir aprovações pela GUI (Automação + Acesso Total ao Disco) nessa sessão de usuário do bot.

  </Accordion>

  <Accordion title="Mac remoto via Tailscale (exemplo)">
    Topologia comum:

    - gateway executa em Linux/VM
    - iMessage + `imsg` executa em um Mac na sua tailnet
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

    Use chaves SSH para que tanto SSH quanto SCP sejam não interativos.
    Garanta primeiro que a chave do host seja confiável (por exemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja preenchido.

  </Accordion>

  <Accordion title="Padrão de várias contas">
    iMessage aceita configuração por conta em `channels.imessage.accounts`.

    Cada conta pode sobrescrever campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configurações de histórico e listas de permissões de raízes de anexos.

  </Accordion>

  <Accordion title="Histórico de mensagens diretas">
    Defina `channels.imessage.dmHistoryLimit` para semear novas sessões de mensagem direta com histórico recente decodificado de `imsg` para essa conversa. Use `channels.imessage.dms["<sender>"].historyLimit` para sobrescritas por remetente, incluindo `0` para desabilitar histórico para um remetente.

    O histórico de DM do iMessage é buscado sob demanda em `imsg`. Deixar `dmHistoryLimit` indefinido desabilita a semeadura global de histórico de DM, mas um `channels.imessage.dms["<sender>"].historyLimit` positivo por remetente ainda habilita a semeadura para esse remetente.

  </Accordion>
</AccordionGroup>

## Mídia, fragmentação e alvos de entrega

<AccordionGroup>
  <Accordion title="Anexos e mídia">
    - a ingestão de anexos recebidos fica **desativada por padrão** — defina `channels.imessage.includeAttachments: true` para encaminhar fotos, memorandos de voz, vídeos e outros anexos ao agente. Com ela desativada, iMessages contendo somente anexos são descartadas antes de chegar ao agente e podem não produzir nenhuma linha de log `Inbound message`.
    - caminhos de anexos remotos podem ser buscados via SCP quando `remoteHost` está definido
    - caminhos de anexos precisam corresponder às raízes permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - padrão de raiz padrão: `/Users/*/Library/Messages/Attachments`
    - SCP usa verificação rigorosa de chave de host (`StrictHostKeyChecking=yes`)
    - o tamanho de mídia enviada usa `channels.imessage.mediaMaxMb` (padrão 16 MB)

  </Accordion>

  <Accordion title="Divisão de envios em partes">
    - limite de parte de texto: `channels.imessage.textChunkLimit` (padrão 4000)
    - modo de divisão em partes: `channels.imessage.chunkMode`
      - `length` (padrão)
      - `newline` (divisão priorizando parágrafos)

  </Accordion>

  <Accordion title="Formatos de endereçamento">
    Destinos explícitos preferidos:

    - `chat_id:123` (recomendado para roteamento estável)
    - `chat_guid:...`
    - `chat_identifier:...`

    Destinos por identificador também são aceitos:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Ações de API privada

Quando `imsg launch` está em execução e `openclaw channels status --probe` relata `privateApi.available: true`, a ferramenta de mensagens pode usar ações nativas do iMessage além dos envios de texto normais.

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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ações disponíveis">
    - **react**: Adiciona/remove tapbacks do iMessage (`messageId`, `emoji`, `remove`). Tapbacks aceitos mapeiam para amar, curtir, não curtir, rir, enfatizar e interrogação.
    - **reply**: Envia uma resposta em thread para uma mensagem existente (`messageId`, `text` ou `message`, mais `chatGuid`, `chatId`, `chatIdentifier` ou `to`).
    - **sendWithEffect**: Envia texto com um efeito do iMessage (`text` ou `message`, `effect` ou `effectId`).
    - **edit**: Edita uma mensagem enviada em versões compatíveis do macOS/API privada (`messageId`, `text` ou `newText`).
    - **unsend**: Retrai uma mensagem enviada em versões compatíveis do macOS/API privada (`messageId`).
    - **upload-file**: Envia mídia/arquivos (`buffer` como base64 ou um `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias legado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gerencia chats em grupo quando o destino atual é uma conversa em grupo.
    - **poll**: Cria uma enquete nativa do Apple Messages (`pollQuestion`, `pollOption` repetido de 2 a 12 vezes, mais `chatGuid`, `chatId`, `chatIdentifier` ou `to`). Destinatários no iOS/iPadOS/macOS 26+ veem e votam nela nativamente; versões mais antigas do sistema operacional recebem um fallback de texto "Enviou uma enquete". Requer `selectors.pollPayloadMessage`.
    - **poll-vote**: Vota em uma enquete existente (`pollId` ou `messageId`, mais exatamente um de `pollOptionIndex`, `pollOptionId` ou `pollOptionText`). Requer `selectors.pollVoteMessage` e o método RPC `poll.vote`.

    Enquetes recebidas aceitas são renderizadas para o agente com a pergunta, rótulos numerados das opções, contagens de votos e o ID da mensagem de enquete necessário para `poll-vote`.

  </Accordion>

  <Accordion title="IDs de mensagem">
    O contexto recebido do iMessage inclui valores `MessageSid` curtos e GUIDs completos de mensagem quando disponíveis. IDs curtos são limitados ao cache recente de respostas com suporte em SQLite e são verificados contra o chat atual antes do uso. Se um ID curto expirou ou pertence a outro chat, tente novamente com o `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Detecção de capacidade">
    O OpenClaw oculta ações de API privada somente quando o status em cache da sondagem indica que a ponte está indisponível. Se o status for desconhecido, as ações permanecem visíveis e disparam sondagens sob demanda para que a primeira ação possa ter sucesso após `imsg launch` sem uma atualização manual separada de status.

  </Accordion>

  <Accordion title="Confirmações de leitura e digitação">
    Quando a ponte de API privada está ativa, chats recebidos aceitos são marcados como lidos e chats diretos mostram um balão de digitação assim que o turno é aceito, enquanto o agente prepara o contexto e gera a resposta. Desative a marcação de leitura com:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Builds mais antigas do `imsg` anteriores à lista de capacidades por método bloquearão digitação/leitura silenciosamente; o OpenClaw registra um aviso único por reinicialização para que a confirmação ausente seja atribuível.

  </Accordion>

  <Accordion title="Tapbacks recebidos">
    O OpenClaw assina tapbacks do iMessage e roteia reações aceitas como eventos de sistema em vez de texto de mensagem normal, então um tapback de usuário não dispara um loop de resposta comum.

    O modo de notificação é controlado por `channels.imessage.reactionNotifications`:

    - `"own"` (padrão): notifica somente quando usuários reagem a mensagens escritas pelo bot.
    - `"all"`: notifica para todos os tapbacks recebidos de remetentes autorizados.
    - `"off"`: ignora tapbacks recebidos.

    Substituições por conta usam `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reações de aprovação (👍 / 👎)">
    Quando `approvals.exec.enabled` ou `approvals.plugin.enabled` é verdadeiro e a solicitação é roteada para o iMessage, o gateway entrega uma solicitação de aprovação nativamente e aceita um tapback para resolvê-la:

    - `👍` (tapback de curtir) → `allow-once`
    - `👎` (tapback de não curtir) → `deny`
    - `allow-always` continua sendo um fallback manual: envie `/approve <id> allow-always` como uma resposta comum.

    O tratamento de reações exige que o identificador do usuário que reagiu seja um aprovador explícito. A lista de aprovadores é lida de `channels.imessage.allowFrom` (ou `channels.imessage.accounts.<id>.allowFrom`); adicione o número de telefone do usuário no formato E.164 ou o e-mail do Apple ID dele. A entrada curinga `"*"` é respeitada, mas permite que qualquer remetente aprove. O atalho de reação ignora intencionalmente `reactionNotifications`, `dmPolicy` e `groupAllowFrom` porque a lista de permissões de aprovadores explícitos é o único controle que importa para a resolução de aprovações.

    **Mudança de comportamento nesta versão:** Quando `channels.imessage.allowFrom` não está vazio, o comando de texto `/approve <id> <decision>` agora é autorizado contra essa lista de aprovadores (não contra a lista de permissões de DM mais ampla). Remetentes permitidos na lista de permissões de DM, mas não em `allowFrom`, receberão uma negação explícita. Adicione a `allowFrom` todos os operadores que devem poder aprovar via `/approve` (e via reações) para preservar o comportamento anterior. Quando `allowFrom` está vazio, o fallback legado de "mesmo chat" continua em vigor e `/approve` continua autorizando qualquer pessoa permitida pela lista de permissões de DM.

    Observações para operadores:
    - O vínculo da reação é armazenado tanto em memória (com TTL correspondente à expiração da aprovação) quanto no armazenamento persistente chaveado do gateway, então um tapback que chega logo após uma reinicialização do gateway ainda resolve a aprovação.
    - Tapbacks entre dispositivos com `is_from_me=true` (a própria reação do operador em um dispositivo Apple emparelhado) são intencionalmente ignorados para que o bot não possa se autoaprovar.
    - Tapbacks legados em estilo de texto (`Liked "…"` como texto simples de clientes Apple muito antigos) não podem resolver aprovações porque não carregam GUID de mensagem; a resolução por reação exige os metadados estruturados de tapback emitidos por clientes macOS / iOS atuais.

  </Accordion>
</AccordionGroup>

## Escritas de configuração

O iMessage permite escritas de configuração iniciadas pelo canal por padrão (para `/config set|unset` quando `commands.config: true`).

Desative:

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

As duas linhas chegam ao OpenClaw com ~0,8-2,0 s de diferença na maioria das configurações. Sem coalescência, o agente recebe somente o comando no turno 1, responde (muitas vezes "envie-me a URL") e só vê a URL no turno 2 — momento em que o contexto do comando já foi perdido. Esse é o pipeline de envio da Apple, não algo introduzido pelo OpenClaw ou pelo `imsg`.

`channels.imessage.coalesceSameSenderDms` opta uma DM por armazenar em buffer linhas consecutivas do mesmo remetente. Quando `imsg` expõe o marcador estrutural de pré-visualização de URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` em uma das linhas de origem, o OpenClaw mescla somente esse envio dividido real e mantém quaisquer outras linhas em buffer como turnos separados. Em builds mais antigas do `imsg` que não emitem nenhum metadado de balão, o OpenClaw não consegue distinguir um envio dividido de envios separados, então recorre a mesclar o balde. Isso preserva o comportamento anterior aos metadados em vez de regredir envios divididos `Dump <url>` para dois turnos. Chats em grupo continuam despachando por mensagem, para que a estrutura de turnos multiusuário seja preservada.

<Tabs>
  <Tab title="Quando ativar">
    Ative quando:

    - Você distribui Skills que esperam `comando + payload` em uma mensagem (despejar, colar, salvar, enfileirar etc.).
    - Seus usuários colam URLs junto com comandos.
    - Você pode aceitar a latência adicional do turno de DM (veja abaixo).

    Deixe desativado quando:

    - Você precisa de latência mínima de comando para gatilhos de DM de uma única palavra.
    - Todos os seus fluxos são comandos únicos sem acompanhamentos de payload.

  </Tab>
  <Tab title="Ativação">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Com a flag ativada e sem `messages.inbound.byChannel.imessage` explícito nem `messages.inbound.debounceMs` global, a janela de debounce aumenta para **7000 ms** (o padrão legado é 0 ms — sem debounce). A janela mais ampla é necessária porque a cadência de envio dividido de pré-visualização de URL da Apple pode se estender por vários segundos enquanto o Messages.app emite a linha de pré-visualização.

    Para ajustar a janela você mesmo:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Mesclagem precisa precisa dos metadados atuais de payload do `imsg`.** Quando a linha da URL inclui `balloon_bundle_id`, apenas esse split-send real é mesclado e outras linhas em buffer permanecem separadas. Em builds antigos do `imsg` que não expõem metadados de balão, o OpenClaw recorre à mesclagem do bucket em buffer para que split-sends `Dump <url>` não regridam para dois turnos (compatibilidade provisória, removida assim que o `imsg` coalescer split-sends upstream).
    - **Latência adicionada para mensagens de DM.** Com o sinalizador ativado, toda DM (incluindo comandos de controle independentes e follow-ups de texto único) espera até a janela de debounce antes do despacho, caso uma linha de prévia de URL esteja chegando. Mensagens de chat em grupo mantêm despacho instantâneo.
    - **A saída mesclada é limitada.** O texto mesclado é limitado a 4000 caracteres com um marcador explícito `…[truncated]`; anexos são limitados a 20; entradas de origem são limitadas a 10 (a primeira mais as mais recentes são mantidas além disso). Todo GUID de origem é rastreado em `coalescedMessageGuids` para telemetria downstream.
    - **Apenas DM.** Chats em grupo seguem para despacho por mensagem para que o bot continue responsivo quando várias pessoas estiverem digitando.
    - **Opt-in, por canal.** Outros canais (Telegram, WhatsApp, Slack, …) não são afetados. Configurações legadas do BlueBubbles que definem `channels.bluebubbles.coalesceSameSenderDms` devem migrar esse valor para `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Cenários e o que o agente vê

A coluna "Sinalizador ativado" mostra o comportamento em um build do `imsg` que emite `balloon_bundle_id`. Em builds antigos do `imsg` que não emitem nenhum metadado de balão, as linhas abaixo marcadas como "Dois turnos" / "N turnos" recorrem a uma mesclagem legada (um turno): o OpenClaw não consegue distinguir estruturalmente um split-send de envios separados, então preserva a mesclagem anterior aos metadados. A separação precisa é ativada quando o build emite metadados de balão.

| Usuário compõe                                                     | `chat.db` produz                    | Sinalizador desativado (padrão)               | Sinalizador ativado + janela (imsg emite metadados de balão)                                         |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (um envio)                              | 2 linhas com ~1 s de intervalo      | Dois turnos do agente: "Dump" sozinho, depois URL | Um turno: texto mesclado `Dump https://example.com`                                                  |
| `Save this 📎image.jpg caption` (anexo + texto)                    | 2 linhas sem metadados de balão de URL | Dois turnos                                | Dois turnos depois que metadados são observados; um turno mesclado em sessões antigas/pré-latch sem metadados |
| `/status` (comando independente)                                   | 1 linha                             | Despacho instantâneo                          | **Espera até a janela, depois despacha**                                                             |
| URL colada sozinha                                                 | 1 linha                             | Despacho instantâneo                          | Espera até a janela, depois despacha                                                                 |
| Texto + URL enviados como duas mensagens separadas deliberadas, com minutos de intervalo | 2 linhas fora da janela | Dois turnos | Dois turnos (a janela expira entre eles)                                                             |
| Enxurrada rápida (>10 DMs pequenas dentro da janela)               | N linhas sem metadados de balão de URL | N turnos                                  | N turnos depois que metadados são observados; um turno mesclado limitado em sessões antigas/pré-latch sem metadados |
| Duas pessoas digitando em um chat em grupo                         | N linhas de M remetentes            | M+ turnos (um por bucket de remetente)        | M+ turnos — chats em grupo não são coalescidos                                                       |

## Recuperação de entrada após uma reinicialização da ponte ou do gateway

O iMessage recupera mensagens perdidas enquanto o gateway estava fora do ar e, ao mesmo tempo, suprime a "bomba de backlog" obsoleta que a Apple pode liberar após uma recuperação por Push. O comportamento padrão está sempre ativado, construído sobre a deduplicação de entrada.

- **Deduplicação de replay.** Toda mensagem de entrada despachada é registrada por seu GUID da Apple no estado persistente do Plugin (`imessage.inbound-dedupe`), reivindicada na ingestão e confirmada após o processamento (liberada em uma falha transitória para que possa tentar novamente). Qualquer coisa já processada é descartada em vez de ser despachada duas vezes. É isso que permite que a recuperação faça replay agressivamente sem bookkeeping por mensagem.
- **Recuperação de indisponibilidade.** Na inicialização, o monitor lembra o último rowid de `chat.db` despachado (um cursor persistido por conta) e o passa para `imsg watch.subscribe` como `since_rowid`, para que o imsg reproduza as linhas que chegaram enquanto o gateway estava fora do ar e depois acompanhe ao vivo. O replay é limitado às linhas mais recentes e a mensagens com até ~2 horas de idade, e a deduplicação descarta qualquer coisa já processada.
- **Cerca de idade para backlog obsoleto.** Linhas acima do limite de inicialização são genuinamente ao vivo; uma cujo envio é mais de ~15 minutos anterior à chegada é backlog de flush do Push e é suprimida. Linhas reproduzidas (no limite ou abaixo dele) usam a janela de recuperação mais ampla, então uma mensagem perdida recentemente é entregue enquanto histórico antigo não é.

A recuperação funciona tanto em configurações locais quanto remotas de `cliPath`, porque o replay de `since_rowid` usa a mesma conexão RPC do `imsg`. A diferença é a janela: quando o gateway consegue ler `chat.db` (local), ele ancora o limite de rowid de inicialização, limita o intervalo de replay e entrega mensagens perdidas com até algumas horas de idade. Por um `cliPath` remoto via SSH, ele não consegue ler o banco de dados, então o replay não tem limite e toda linha usa a cerca de idade ao vivo — ele ainda recupera mensagens perdidas recentemente e ainda suprime backlog antigo, só com a janela ao vivo mais estreita. Execute o gateway no Mac do Messages para a janela de recuperação mais ampla.

### Sinal visível ao operador

Backlog suprimido é registrado no nível padrão, nunca descartado silenciosamente (o sinalizador `recovery` mostra qual janela foi aplicada):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Migração

`channels.imessage.catchup.*` está obsoleto — a recuperação de indisponibilidade agora é automática e não precisa de configuração para novas instalações. Configurações existentes com `catchup.enabled: true` continuam sendo honradas como um perfil de compatibilidade para a janela de replay de recuperação. Blocos de catchup desativados (`enabled: false` ou sem `enabled: true`) foram aposentados; `openclaw doctor --fix` os remove.

## Solução de problemas

<AccordionGroup>
  <Accordion title="imsg não encontrado ou RPC sem suporte">
    Valide o binário e o suporte a RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Se o probe informar RPC sem suporte, atualize o `imsg`. Se ações de API privada estiverem indisponíveis, execute `imsg launch` na sessão do usuário macOS conectado e execute o probe novamente. Se o Gateway não estiver rodando no macOS, use a configuração Mac remoto via SSH acima em vez do caminho local padrão do `imsg`.

  </Accordion>

  <Accordion title="Mensagens enviam, mas iMessages de entrada não chegam">
    Primeiro prove se a mensagem chegou ao Mac local. Se `chat.db` não mudar, o OpenClaw não consegue receber a mensagem mesmo quando `imsg status --json` informa uma ponte saudável.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Se mensagens enviadas pelo telefone não criarem novas linhas, repare a camada Messages do macOS e Apple Push antes de alterar a configuração do OpenClaw. Uma atualização pontual de serviço costuma bastar:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envie um novo iMessage pelo telefone e confirme uma nova linha em `chat.db` ou um evento de `imsg watch` antes de depurar sessões do OpenClaw. Não execute isso como um loop periódico de relançamento da ponte; `imsg launch` repetido mais reinicializações do gateway durante trabalho ativo podem interromper entregas e deixar execuções de canal em andamento presas.

  </Accordion>

  <Accordion title="Gateway não está rodando no macOS">
    O `cliPath: "imsg"` padrão deve rodar no Mac conectado ao Messages. No Linux ou Windows, defina `channels.imessage.cliPath` para um script wrapper que faça SSH para esse Mac e execute `imsg "$@"`.

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
    - comportamento da lista de permissões de `channels.imessage.groups`
    - configuração de padrões de menção (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Anexos remotos falham">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticação por chave SSH/SCP a partir do host do gateway
    - a chave do host existe em `~/.ssh/known_hosts` no host do gateway
    - legibilidade do caminho remoto no Mac que roda o Messages

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

## Relacionados

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Remoção do BlueBubbles e o caminho iMessage do imsg](/pt-BR/announcements/bluebubbles-imessage) — anúncio e resumo da migração
- [Vindo do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) — tabela de tradução de configuração e cutover passo a passo
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening

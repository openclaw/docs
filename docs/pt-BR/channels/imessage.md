---
read_when:
    - Configurando o suporte ao iMessage
    - Depuração do envio/recebimento do iMessage
summary: Suporte nativo ao iMessage via imsg (JSON-RPC sobre stdio), com ações de API privada para respostas, tapbacks, efeitos, enquetes, anexos e gerenciamento de grupos. Recomendado para novas configurações do iMessage no OpenClaw quando os requisitos do host forem atendidos.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T12:07:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para a implantação usual do iMessage no OpenClaw, execute o Gateway e o `imsg` no mesmo host macOS com sessão iniciada no Mensagens. Se o Gateway for executado em outro lugar, aponte `channels.imessage.cliPath` para um wrapper SSH transparente que execute `imsg` no Mac.

**A recuperação de entrada é automática.** Após a reinicialização de uma ponte ou do Gateway, o iMessage reproduz as mensagens perdidas enquanto estava inativo e suprime a "bomba de backlog" obsoleta que a Apple pode liberar após uma recuperação de Push, eliminando duplicatas para que nada seja encaminhado duas vezes. Não há configuração para habilitar — consulte [Recuperação de entrada após a reinicialização de uma ponte ou do Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
O suporte ao BlueBubbles foi removido. Migre as configurações de `channels.bluebubbles` para `channels.imessage`; o OpenClaw oferece suporte ao iMessage somente por meio de `imsg`. Comece por [Remoção do BlueBubbles e o caminho do iMessage com imsg](/pt-BR/announcements/bluebubbles-imessage) para ver o anúncio resumido ou por [Migração do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) para ver a tabela completa de migração.
</Warning>

Status: integração nativa com CLI externa. O Gateway inicia `imsg rpc` e se comunica por JSON-RPC via stdio — sem daemon ou porta separados. O modo de API privada é altamente recomendado para um canal iMessage completo; respostas, tapbacks, efeitos, enquetes, respostas a anexos e ações de grupo exigem `imsg launch` e uma sondagem bem-sucedida da API privada.

Para a configuração local comum, a configuração do OpenClaw pode oferecer, mediante confirmação do usuário, a instalação ou atualização de `imsg` pelo Homebrew no Mac com sessão iniciada no Mensagens. A configuração manual e as topologias com wrapper SSH continuam sob responsabilidade do operador: instale ou atualize `imsg` no mesmo contexto de usuário que executará o Gateway ou o wrapper.

<CardGroup cols={3}>
  <Card title="Ações da API privada" icon="wand-sparkles" href="#private-api-actions">
    Respostas, tapbacks, efeitos, enquetes, anexos e gerenciamento de grupos.
  </Card>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As mensagens diretas do iMessage usam o modo de pareamento por padrão.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Use um wrapper SSH quando o Gateway não estiver em execução no Mac do Mensagens.
  </Card>
  <Card title="Referência de configuração" icon="settings" href="/pt-BR/gateway/config-channels#imessage">
    Referência completa dos campos do iMessage.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Mac local (caminho rápido)">
    <Steps>
      <Step title="Instalar e verificar o imsg">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        Quando o assistente de configuração local detecta a ausência de um comando `imsg` padrão, ele pode solicitar a instalação de `steipete/tap/imsg` pelo Homebrew. Se detectar um `imsg` gerenciado pelo Homebrew, ele poderá solicitar sua reinstalação ou atualização. Wrappers `cliPath` personalizados não são modificados.

      </Step>

      <Step title="Configurar o OpenClaw">

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

      <Step title="Iniciar o Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Aprovar o primeiro pareamento por mensagem direta (dmPolicy padrão)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        As solicitações de pareamento expiram após 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto via SSH">
    A maioria das configurações não precisa de SSH. Use esta topologia somente quando o Gateway não puder ser executado no Mac com sessão iniciada no Mensagens. O OpenClaw exige apenas um `cliPath` compatível com stdio, portanto, é possível apontar `cliPath` para um script wrapper que se conecte por SSH a um Mac remoto e execute `imsg`.
    Instale e atualize `imsg` nesse Mac remoto, não no host do Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Configuração recomendada quando os anexos estão habilitados:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // usado para buscar anexos via SCP
      includeAttachments: true,
      // Opcional: raízes adicionais permitidas para anexos (mescladas com a raiz padrão
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` não estiver definido, o OpenClaw tentará detectá-lo automaticamente analisando o script wrapper SSH.
    `remoteHost` deve ser `host` ou `user@host` (sem espaços ou opções SSH); valores não seguros são ignorados.
    O OpenClaw usa verificação estrita da chave do host para SCP, portanto, a chave do host de retransmissão já deve existir em `~/.ssh/known_hosts`.
    Os caminhos de anexos são validados em relação às raízes permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Qualquer wrapper `cliPath` ou proxy SSH colocado à frente de `imsg` DEVE se comportar como um pipe stdio transparente para JSON-RPC de longa duração. O OpenClaw troca pequenas mensagens JSON-RPC delimitadas por novas linhas pelo stdin/stdout do wrapper durante toda a vida útil do canal:

- Encaminhe cada bloco/linha do stdin **assim que os bytes estiverem disponíveis** — não espere pelo EOF.
- Encaminhe prontamente cada bloco/linha do stdout na direção inversa.
- Preserve as novas linhas.
- Evite leituras bloqueantes de tamanho fixo (`read(4096)`, `cat | buffer`, `read` padrão do shell), que podem impedir o processamento de frames pequenos.
- Mantenha o stderr separado do fluxo stdout do JSON-RPC.

Um wrapper que armazena o stdin em buffer até preencher um bloco grande produzirá sintomas semelhantes a uma indisponibilidade do iMessage — `imsg rpc timeout (chats.list)` ou reinicializações repetidas do canal — mesmo que o próprio `imsg rpc` esteja íntegro. `ssh -T host imsg "$@"` (acima) é seguro porque encaminha os argumentos `cliPath` do OpenClaw, como `rpc` e `--db`. Pipelines como `ssh host imsg | grep -v '^DEBUG'` NÃO são seguros — ferramentas com buffer por linha ainda podem reter frames; use `stdbuf -oL -eL` em cada estágio se precisar filtrar.
</Warning>

  </Tab>
</Tabs>

## Requisitos e permissões (macOS)

- O Mensagens deve estar com a sessão iniciada no Mac que executa `imsg`.
- O Acesso Total ao Disco é obrigatório para o contexto de processo que executa o OpenClaw/`imsg` (acesso ao banco de dados do Mensagens).
- A permissão de Automação é obrigatória para enviar mensagens pelo Messages.app.
- Para ações avançadas (reagir / editar / desfazer envio / resposta em thread / efeitos / enquetes / operações de grupo), a Proteção da Integridade do Sistema deve ser desativada — consulte [Ativação da API privada do imsg](#enabling-the-imsg-private-api). O envio e recebimento básico de texto e mídia funciona sem isso.

<Tip>
As permissões são concedidas por contexto de processo. Se o Gateway for executado sem interface gráfica (LaunchAgent/SSH), execute uma vez um comando interativo nesse mesmo contexto para acionar as solicitações:

```bash
imsg chats --limit 1
# ou
imsg send <handle> "test"
```

</Tip>

<Accordion title="Falha nos envios pelo wrapper SSH com AppleEvents -1743">
  Uma configuração com SSH remoto pode ler conversas, passar por `channels status --probe` e processar mensagens recebidas, enquanto os envios ainda falham com um erro de autorização do AppleEvents:

```text
Sem autorização para enviar eventos Apple ao Mensagens. (-1743)
```

Verifique o banco de dados TCC do usuário com sessão iniciada no Mac ou System Settings > Privacy & Security > Automation. Se a entrada de Automação estiver registrada para `/usr/libexec/sshd-keygen-wrapper`, em vez de para `imsg` ou para o processo do shell local, o macOS talvez não exponha um controle utilizável do Mensagens para esse cliente no lado do servidor SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

Nesse estado, repetir `tccutil reset AppleEvents` ou executar novamente `imsg send` pelo mesmo wrapper SSH pode continuar falhando porque o contexto de processo que precisa da Automação do Mensagens é o wrapper SSH, não um aplicativo ao qual a interface possa conceder acesso.

Em vez disso, use um dos contextos de processo `imsg` compatíveis:

- Execute o Gateway, ou pelo menos a ponte `imsg`, na sessão local do usuário com sessão iniciada no Mensagens.
- Inicie o Gateway com um LaunchAgent desse usuário depois de conceder Acesso Total ao Disco e Automação na mesma sessão.
- Se mantiver a topologia SSH com dois usuários, confirme que um envio real por `imsg send` funciona pelo wrapper exato antes de habilitar o canal. Se não for possível conceder Automação a ele, reconfigure para uma configuração `imsg` com um único usuário, em vez de depender do wrapper SSH para os envios.

</Accordion>

## Ativação da API privada do imsg

`imsg` é fornecido em dois modos operacionais. Para o OpenClaw, o modo de API privada é a configuração recomendada porque fornece ao canal as ações nativas do iMessage esperadas pelos usuários. O modo básico continua útil para instalações de baixo risco, verificação inicial ou hosts nos quais não é possível desativar o SIP.

- **Modo básico** (padrão, sem necessidade de alterar o SIP): envio de texto e mídia por `send`, monitoramento/histórico de entrada e lista de conversas. Isso é o que se obtém imediatamente com uma instalação nova de `brew install steipete/tap/imsg` e as permissões padrão do macOS descritas acima.
- **Modo de API privada**: `imsg` injeta uma dylib auxiliar em `Messages.app` para chamar funções internas de `IMCore`. Isso desbloqueia `react`, `edit`, `unsend`, `reply` (em thread), `sendWithEffect`, `poll` e `poll-vote` (enquetes nativas do Mensagens), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, além de indicadores de digitação e confirmações de leitura.

A superfície de ações recomendada nesta página exige o modo de API privada. O README de `imsg` é explícito sobre o requisito:

> Recursos avançados, como `read`, `typing`, `launch`, envio avançado com suporte da ponte, alteração de mensagens e gerenciamento de conversas, são opcionais. Eles exigem que o SIP esteja desativado e que uma dylib auxiliar seja injetada em `Messages.app`. `imsg launch` se recusa a fazer a injeção quando o SIP está habilitado.

A técnica de injeção do auxiliar usa a própria dylib de `imsg` para acessar as APIs privadas do Mensagens. Não há servidor de terceiros nem runtime do BlueBubbles no caminho do iMessage no OpenClaw.

<Warning>
**Desativar o SIP envolve uma desvantagem real de segurança.** O SIP é uma das principais proteções do macOS contra a execução de código de sistema modificado; desativá-lo em todo o sistema amplia a superfície de ataque e os possíveis efeitos colaterais. É importante observar que **desativar o SIP em Macs com Apple Silicon também desativa a capacidade de instalar e executar aplicativos para iOS no Mac**.

Trate isso como uma decisão operacional deliberada, especialmente em um Mac pessoal principal. Para usar o iMessage com o OpenClaw com qualidade de produção, prefira um Mac dedicado ou um usuário bot do macOS no qual seja aceitável habilitar a ponte. Se o seu modelo de ameaças não puder tolerar que o SIP seja desativado em nenhum lugar, o iMessage incluído ficará limitado ao modo básico — somente envio e recebimento de texto e mídia, sem reações / edição / desfazer envio / efeitos / operações de grupo.
</Warning>

### Configuração

1. **Instale (ou atualize) `imsg`** no Mac que executa o Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   A saída de `imsg status --json` informa `bridge_version`, `rpc_methods` e `selectors` por método, para que seja possível verificar o que a compilação atual oferece antes de começar.

2. **Desative a Proteção de Integridade do Sistema e, no macOS moderno, a Validação de Biblioteca.** Injetar uma dylib auxiliar que não seja da Apple no `Messages.app` assinado pela Apple exige que o SIP esteja desativado **e** que a validação de biblioteca esteja relaxada. A etapa do SIP no modo de Recuperação varia conforme a versão do macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** desative a Validação de Biblioteca pelo Terminal, reinicie no modo de Recuperação, execute `csrutil disable` e reinicie.
   - **macOS 11+ (Big Sur e posteriores), Intel:** entre no modo de Recuperação (ou Recuperação pela Internet), execute `csrutil disable` e reinicie.
   - **macOS 11+, Apple Silicon:** use a sequência de inicialização pelo botão liga/desliga para entrar na Recuperação; nas versões recentes do macOS, mantenha pressionada a tecla **Left Shift** ao clicar em Continue e, em seguida, execute `csrutil disable`. Configurações de máquina virtual seguem um fluxo separado; portanto, primeiro crie um snapshot da VM.

   **No macOS 11 e posteriores, apenas `csrutil disable` geralmente não é suficiente.** A Apple ainda impõe a validação de biblioteca ao `Messages.app` por ele ser um binário da plataforma; portanto, um auxiliar com assinatura ad hoc é rejeitado (`Library Validation failed: ... platform binary, but mapped file is not`) mesmo com o SIP desativado. Depois de desativar o SIP, desative também a validação de biblioteca e reinicie:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), verificado na versão 26.5.1:** o SIP desativado **mais** o comando `DisableLibraryValidation` acima são suficientes para injetar o auxiliar nas versões 26.0 a 26.5.x. **Nenhum argumento de inicialização é necessário.** O plist é o fator decisivo e a etapa ausente mais comum quando a injeção falha no Tahoe:
   - **Com o plist:** `imsg launch` faz a injeção e `imsg status` informa `advanced_features: true`.
   - **Sem o plist (mesmo com o SIP desativado):** `imsg launch` falha com `Failed to launch: Timeout waiting for Messages.app to initialize`. O AMFI rejeita o auxiliar com assinatura ad hoc durante o carregamento; portanto, a ponte nunca fica pronta e a inicialização atinge o tempo limite. Esse tempo limite é o sintoma que a maioria das pessoas encontra no Tahoe; a correção é o plist acima, não alguma medida mais drástica.

   Se a injeção de `imsg launch` ou algum `selectors` específico começar a retornar falso após uma atualização do macOS, essa restrição geralmente é a causa. Verifique o estado do SIP e da validação de biblioteca antes de presumir que a própria etapa do SIP falhou. Se essas configurações estiverem corretas e ainda não for possível injetar a ponte, colete `imsg status --json` junto com a saída de `imsg launch` e informe ao projeto `imsg`, em vez de enfraquecer outros controles de segurança em todo o sistema.

3. **Injete o auxiliar.** Com o SIP desativado e uma sessão iniciada no Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` se recusa a fazer a injeção quando o SIP ainda está ativado; portanto, isso também serve como confirmação de que a etapa 2 foi realizada.

4. **Verifique a ponte pelo OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   A entrada do iMessage deve informar `works`, e `imsg status --json | jq '{rpc_methods, selectors}'` deve mostrar os recursos expostos pela sua compilação do macOS. A criação de enquetes exige `selectors.pollPayloadMessage`; a votação exige `selectors.pollVoteMessage` e o método RPC `poll.vote`. O plugin do OpenClaw anuncia somente as ações compatíveis com a sondagem armazenada em cache, enquanto um cache vazio permanece otimista e faz a sondagem no primeiro envio.

Se `openclaw channels status --probe` informar o canal como `works`, mas ações específicas lançarem "iMessage `<action>` requires the imsg private API bridge" no momento do envio, execute `imsg launch` novamente — o auxiliar pode ser desconectado (reinicialização do Messages.app, atualização do sistema operacional etc.), e o status `available: true` armazenado em cache continuará anunciando as ações até que a próxima sondagem o atualize.

### Quando o SIP permanece ativado

Se desativar o SIP não for aceitável para o seu modelo de ameaças:

- `imsg` recorre ao modo básico — somente texto, mídia e recebimento.
- O plugin do OpenClaw continua anunciando o envio de texto/mídia e o monitoramento de mensagens recebidas; ele oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` e operações de grupo da superfície de ações (de acordo com a restrição de recursos por método).
- É possível executar um Mac separado que não use Apple Silicon (ou um Mac dedicado ao bot) com o SIP desativado para a carga de trabalho do iMessage, mantendo o SIP ativado nos dispositivos principais. Consulte [Usuário dedicado do macOS para o bot (identidade separada do iMessage)](#deployment-patterns) abaixo.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de mensagens diretas">
    `channels.imessage.dmPolicy` controla as mensagens diretas:

    - `pairing` (padrão)
    - `allowlist` (exige pelo menos uma entrada em `allowFrom`)
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    Campo da lista de permissões: `channels.imessage.allowFrom`.

    As entradas da lista de permissões devem identificar remetentes: identificadores ou grupos estáticos de acesso de remetentes (`accessGroup:<name>`). Use `channels.imessage.groupAllowFrom` para destinos de conversa como `chat_id:*`, `chat_guid:*` ou `chat_identifier:*`; use `channels.imessage.groups` para chaves numéricas do registro `chat_id`.

  </Tab>

  <Tab title="Política de grupos + menções">
    `channels.imessage.groupPolicy` controla o tratamento de grupos:

    - `allowlist` (padrão)
    - `open`
    - `disabled`

    Lista de permissões de remetentes de grupos: `channels.imessage.groupAllowFrom`.

    As entradas de `groupAllowFrom` também podem referenciar grupos estáticos de acesso de remetentes (`accessGroup:<name>`).

    Alternativa em tempo de execução: se `groupAllowFrom` não estiver definido, as verificações de remetentes de grupos do iMessage usarão `allowFrom`; defina `groupAllowFrom` quando a admissão em mensagens diretas e grupos precisar ser diferente. Um `groupAllowFrom: []` explicitamente vazio não usa a alternativa — ele bloqueia todos os remetentes de grupos em `allowlist`.
    Observação sobre o tempo de execução: se `channels.imessage` estiver completamente ausente, o tempo de execução recorrerá a `groupPolicy="allowlist"` e registrará um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    <Warning>
    O roteamento de grupos em `groupPolicy: "allowlist"` executa **duas** restrições consecutivas:

    1. **Lista de permissões de remetentes** (`channels.imessage.groupAllowFrom`) — identificador, `accessGroup:<name>`, `chat_guid`, `chat_identifier` ou `chat_id`. Uma lista efetiva vazia (sem `groupAllowFrom` e sem a alternativa `allowFrom`) bloqueia todos os remetentes de grupos.
    2. **Registro de grupos** (`channels.imessage.groups`) — aplicado quando o mapa contém entradas: a conversa deve corresponder a uma entrada explícita por `chat_id` ou ao curinga `groups: { "*": { ... } }`. Quando `groups` está vazio ou ausente, somente a lista de permissões de remetentes decide a admissão.

    Se nenhuma lista efetiva de permissões de remetentes de grupos estiver configurada, todas as mensagens de grupo serão descartadas antes da restrição do registro. Cada restrição possui seu próprio sinal de nível `warn` no nível de log padrão, e cada uma indica uma correção diferente:

    - uma vez por conta na inicialização, quando a lista efetiva de permissões de remetentes de grupos está vazia: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — corrija definindo `channels.imessage.groupAllowFrom` (ou `allowFrom`); adicionar somente entradas em `groups` mantém a restrição 1 bloqueando todos os remetentes.
    - uma vez por `chat_id` em tempo de execução, quando um remetente passou pela restrição 1, mas a conversa não consta em um registro `groups` preenchido: `imessage: dropping group message from chat_id=<id> ...` — corrija adicionando esse `chat_id` (ou `"*"`) em `channels.imessage.groups`.

    As mensagens diretas não são afetadas — elas seguem um caminho de código diferente.

    Configuração recomendada para o fluxo de grupos em `groupPolicy: "allowlist"`:

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

    Apenas `groupAllowFrom` admite esses remetentes em qualquer grupo; adicione o bloco `groups` para limitar quais conversas são permitidas (e definir opções por conversa, como `requireMention`).
    </Warning>

    Restrição por menção em grupos:

    - o iMessage não possui metadados nativos de menção
    - a detecção de menções usa padrões de expressões regulares (`agents.list[].groupChat.mentionPatterns`, com alternativa em `messages.groupChat.mentionPatterns`)
    - sem padrões configurados, a restrição por menção não pode ser aplicada
    - comandos de controle de remetentes autorizados ignoram a restrição por menção

    `systemPrompt` por grupo:

    Cada entrada em `channels.imessage.groups.*` aceita uma string `systemPrompt` opcional, injetada no prompt de sistema do agente em cada turno que trata uma mensagem desse grupo. A resolução segue a mesma lógica de `channels.whatsapp.groups`:

    1. **Prompt de sistema específico do grupo** (`groups["<chat_id>"].systemPrompt`): usado quando a entrada específica do grupo existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga será suprimido e nenhum prompt de sistema será aplicado ao grupo.
    2. **Prompt de sistema curinga para grupos** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está completamente ausente do mapa ou quando existe, mas não define nenhuma chave `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use a ortografia britânica." },
            "8421": {
              requireMention: true,
              systemPrompt: "Esta é a conversa da escala de plantão. Mantenha as respostas com menos de 3 frases.",
            },
            "9907": {
              // supressão explícita: o curinga "Use a ortografia britânica." não se aplica aqui
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompts por grupo se aplicam somente a mensagens de grupo — mensagens diretas não são afetadas.

  </Tab>

  <Tab title="Sessões e respostas determinísticas">
    - Mensagens diretas usam roteamento direto; grupos usam roteamento de grupo.
    - Com o `session.dmScope=main` padrão, as mensagens diretas do iMessage são consolidadas na sessão principal do agente.
    - As sessões de grupo são isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - As respostas são encaminhadas de volta ao iMessage usando os metadados do canal e do destino de origem.

    Comportamento de threads semelhantes a grupos:

    Algumas threads do iMessage com vários participantes podem chegar com `is_group=false`.
    Se esse `chat_id` estiver explicitamente configurado em `channels.imessage.groups`, o OpenClaw o tratará como tráfego de grupo (restrições de grupo + isolamento da sessão de grupo).

  </Tab>
</Tabs>

## Vínculos de conversas ACP

As conversas do iMessage podem ser vinculadas a sessões ACP.

Fluxo rápido para operadores:

- Execute `/acp spawn codex --bind here` dentro da mensagem direta ou da conversa de grupo permitida.
- As mensagens futuras nessa mesma conversa do iMessage serão encaminhadas à sessão ACP criada.
- `/new` e `/reset` redefinem no local a mesma sessão ACP vinculada.
- `/acp close` encerra a sessão ACP e remove o vínculo.

Vínculos persistentes configurados usam entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` pode usar:

- um identificador normalizado de mensagem direta, como `+15555550123` ou `user@example.com`
- `chat_id:<id>` (recomendado para vínculos de grupo estáveis)
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

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para conhecer o comportamento compartilhado dos vínculos ACP.

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Usuário dedicado do macOS para o bot (identidade separada do iMessage)">
    Use um Apple ID e um usuário do macOS dedicados para que o tráfego do bot fique isolado do seu perfil pessoal do Messages.

    Fluxo típico:

    1. Crie/inicie sessão em um usuário dedicado do macOS.
    2. Inicie sessão no Mensagens com o ID Apple do bot nesse usuário.
    3. Instale `imsg` nesse usuário.
    4. Crie um wrapper SSH para que o OpenClaw possa executar `imsg` no contexto desse usuário.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para esse perfil de usuário.

    A primeira execução pode exigir aprovações pela interface gráfica (Automação + Acesso Total ao Disco) na sessão desse usuário do bot.

  </Accordion>

  <Accordion title="Mac remoto via Tailscale (exemplo)">
    Topologia comum:

    - o Gateway é executado em Linux/VM
    - o iMessage + `imsg` são executados em um Mac na sua tailnet
    - o wrapper `cliPath` usa SSH para executar `imsg`
    - `remoteHost` habilita a obtenção de anexos via SCP

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

    Use chaves SSH para que tanto o SSH quanto o SCP sejam não interativos.
    Primeiro, garanta que a chave do host seja confiável (por exemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja preenchido.

  </Accordion>

  <Accordion title="Padrão de várias contas">
    O iMessage aceita configuração por conta em `channels.imessage.accounts`.

    Cada conta pode substituir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configurações de histórico e listas de permissões de raízes de anexos.

  </Accordion>

  <Accordion title="Histórico de mensagens diretas">
    Defina `channels.imessage.dmHistoryLimit` para preencher novas sessões de mensagens diretas com o histórico recente decodificado de `imsg` dessa conversa. Use `channels.imessage.dms["<sender>"].historyLimit` para substituições por remetente, incluindo `0` para desabilitar o histórico de um remetente.

    O histórico de MDs do iMessage é obtido sob demanda de `imsg`. Deixar `dmHistoryLimit` sem definição desabilita o preenchimento global do histórico de MDs, mas um valor positivo de `channels.imessage.dms["<sender>"].historyLimit` por remetente ainda habilita o preenchimento para esse remetente.

  </Accordion>
</AccordionGroup>

## Mídia, divisão em partes e destinos de entrega

<AccordionGroup>
  <Accordion title="Anexos e mídia">
    - a ingestão de anexos recebidos fica **desativada por padrão** — defina `channels.imessage.includeAttachments: true` para encaminhar fotos, gravações de voz, vídeos e outros anexos ao agente. Com essa opção desabilitada, iMessages que contêm apenas anexos são descartadas antes de chegar ao agente e podem não gerar nenhuma linha de log `Inbound message`.
    - caminhos de anexos remotos podem ser obtidos via SCP quando `remoteHost` está definido
    - os caminhos de anexos devem corresponder às raízes permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - as raízes configuradas ampliam o padrão de raiz padrão `/Users/*/Library/Messages/Attachments` (são mescladas, não substituídas)
    - o SCP usa verificação estrita da chave do host (`StrictHostKeyChecking=yes`)
    - o tamanho da mídia de saída usa `channels.imessage.mediaMaxMb` (padrão de 16 MB)

  </Accordion>

  <Accordion title="Texto de saída e divisão em partes">
    - limite de caracteres por parte: `channels.imessage.textChunkLimit` (padrão de 4000)
    - modo de divisão em partes: `channels.imessage.streaming.chunkMode`
      - `length` (padrão)
      - `newline` (divisão priorizando parágrafos)
    - negrito/itálico/sublinhado/tachado em Markdown de saída é convertido em texto estilizado nativo (destinatários no macOS 15+ veem a estilização; destinatários em versões anteriores veem texto simples sem os marcadores); tabelas Markdown são convertidas conforme o modo de tabela Markdown do canal
    - `channels.imessage.sendTransport` (`auto` por padrão, `bridge`, `applescript`) seleciona como `imsg` realiza os envios

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

## Ações da API privada

Quando `imsg launch` está em execução e `openclaw channels status --probe` informa `privateApi.available: true`, a ferramenta de mensagens pode usar ações nativas do iMessage além dos envios normais de texto.

Todas as ações são habilitadas por padrão; use `channels.imessage.actions` para desativar ações individuais:

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
    - **react**: Adiciona/remove tapbacks do iMessage (`messageId`, `emoji`, `remove`). Os tapbacks compatíveis correspondem a amar, curtir, não curtir, rir, enfatizar e questionar. A remoção sem um emoji limpa qualquer tapback definido.
    - **reply**: Envia uma resposta em thread a uma mensagem existente (`messageId`, `text` ou `message`, além de `chatGuid`, `chatId`, `chatIdentifier` ou `to`). A resposta com anexo também requer uma versão de `imsg` cujo `send-rich` seja compatível com `--file`.
    - **sendWithEffect**: Envia texto com um efeito do iMessage (`text` ou `message`, `effect` ou `effectId`). Nomes abreviados: slam, loud, gentle, invisibleink, confetti, lasers, fireworks, balloon, heart, echo, happybirthday, shootingstar, sparkles, spotlight.
    - **edit**: Edita uma mensagem enviada em versões compatíveis do macOS/API privada (`messageId`, `text` ou `newText`). Somente mensagens enviadas pelo próprio Gateway podem ser editadas.
    - **unsend**: Retira uma mensagem enviada em versões compatíveis do macOS/API privada (`messageId`). Somente mensagens enviadas pelo próprio Gateway podem ser retiradas.
    - **upload-file**: Envia mídia/arquivos (`buffer` como base64 ou um `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias legado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gerenciam conversas em grupo quando o destino atual é uma conversa em grupo. Essas ações alteram a identidade do Mensagens do host, portanto exigem um remetente proprietário ou um cliente Gateway `operator.admin`.
    - **poll**: Cria uma enquete nativa do Mensagens da Apple (`pollQuestion`, `pollOption` repetido de 2 a 12 vezes, além de `chatGuid`, `chatId`, `chatIdentifier` ou `to`). Destinatários no iOS/iPadOS/macOS 26+ veem e votam nela de forma nativa; versões anteriores dos sistemas operacionais recebem o texto alternativo "Enquete enviada". Requer `selectors.pollPayloadMessage`.
    - **poll-vote**: Vota em uma enquete existente (`pollId` ou `messageId`, além de exatamente um entre `pollOptionIndex`, `pollOptionId` ou `pollOptionText`). Requer `selectors.pollVoteMessage` e o método RPC `poll.vote`.

    As enquetes recebidas e aceitas são renderizadas para o agente com a pergunta, os rótulos numerados das opções, as contagens de votos e o ID da mensagem da enquete necessário para `poll-vote`.

  </Accordion>

  <Accordion title="IDs de mensagens">
    O contexto de entrada do iMessage inclui valores curtos de `MessageSid` e GUIDs completos de mensagens (`MessageSidFull`), quando disponíveis. IDs curtos têm o escopo do cache de respostas recentes baseado em SQLite e são verificados em relação à conversa atual antes do uso. Se um ID curto expirar, tente novamente com seu `MessageSidFull` direcionando para a conversa que o forneceu. IDs completos não ignoram a vinculação à conversa ou à conta; portanto, substitua um ID de outra conversa por um do destino atual. Chamadas delegadas remotamente podem rejeitar IDs completos obsoletos quando não há evidência disponível da conversa atual.

  </Accordion>

  <Accordion title="Detecção de recursos">
    O OpenClaw oculta as ações da API privada somente quando o status da sondagem em cache indica que a ponte está indisponível. Se o status for desconhecido, as ações permanecem visíveis e o despacho executa sondagens de forma adiada, para que a primeira ação possa ser bem-sucedida após `imsg launch` sem uma atualização manual separada do status.

  </Accordion>

  <Accordion title="Confirmações de leitura e indicador de digitação">
    Quando a ponte da API privada está ativa, as conversas recebidas e aceitas são marcadas como lidas, e as conversas diretas exibem um balão de digitação assim que o turno é aceito, enquanto o agente prepara o contexto e gera a resposta. Desabilite a marcação como lida com:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Versões antigas de `imsg` anteriores à lista de recursos por método desativam silenciosamente a digitação/leitura; o OpenClaw registra um aviso único a cada reinicialização para que a ausência da confirmação possa ser atribuída.

  </Accordion>

  <Accordion title="Tapbacks recebidos">
    O OpenClaw assina os tapbacks do iMessage e encaminha as reações aceitas como eventos do sistema, em vez de texto normal de mensagem, para que um tapback do usuário não acione um ciclo comum de respostas.

    O modo de notificação é controlado por `channels.imessage.reactionNotifications`:

    - `"own"` (padrão): notifica somente quando os usuários reagem a mensagens criadas pelo bot.
    - `"all"`: notifica sobre todos os tapbacks recebidos de remetentes autorizados.
    - `"off"`: ignora tapbacks recebidos.

    As substituições por conta usam `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Reações de aprovação (👍 / 👎)">
    Quando `approvals.exec.enabled` ou `approvals.plugin.enabled` é verdadeiro e a solicitação é roteada para o iMessage, o Gateway entrega uma solicitação de aprovação de forma nativa e aceita um tapback para resolvê-la:

    - `👍` (tapback Curtir) → `allow-once`
    - `👎` (tapback Não Curtir) → `deny`
    - `allow-always` permanece como alternativa manual: envie `/approve <id> allow-always` como uma resposta normal.

    O processamento de reações exige que o identificador do usuário que reagiu seja de um aprovador explícito. A lista de aprovadores é lida de `channels.imessage.allowFrom` (ou `channels.imessage.accounts.<id>.allowFrom`); adicione o número de telefone do usuário no formato E.164 ou o e-mail do ID Apple dele (destinos de conversa como `chat_id:*` não são entradas de aprovador válidas). A entrada curinga `"*"` é respeitada, mas permite que qualquer remetente aprove; uma lista de aprovadores vazia desabilita completamente o atalho de reação. O atalho de reação ignora intencionalmente `reactionNotifications`, `dmPolicy` e `groupAllowFrom`, pois a lista explícita de aprovadores permitidos é a única verificação relevante para a resolução da aprovação.

    A autorização do comando de texto `/approve` segue a mesma lista: quando `channels.imessage.allowFrom` não está vazio, `/approve <id> <decision>` é autorizado em relação a essa lista de aprovadores (não à lista mais ampla de permissões de MD), e remetentes permitidos na lista de permissões de MD, mas ausentes de `allowFrom`, recebem uma recusa explícita. Quando `allowFrom` está vazio, a alternativa da mesma conversa permanece em vigor, e `/approve` autoriza qualquer pessoa permitida pela lista de permissões de MD. Adicione todos os operadores que devem poder aprovar — por meio de `/approve` ou de reações — a `allowFrom`.

    Observações para operadores:
    - A associação da reação é armazenada tanto na memória quanto no armazenamento persistente por chave do gateway (com o TTL correspondente à expiração da aprovação), e o gateway também consulta periodicamente os prompts pendentes em busca de tapbacks; portanto, um tapback recebido logo após a reinicialização do gateway ainda resolve a aprovação.
    - O tapback `is_from_me=true` do próprio operador (por exemplo, de um dispositivo Apple emparelhado) resolve a aprovação quando esse identificador é um aprovador explícito.
    - Os prompts de aprovação são encaminhados para uma conversa em grupo somente quando aprovadores explícitos estão configurados; caso contrário, qualquer membro do grupo poderia aprovar.
    - Tapbacks legados em formato de texto (`Liked "…"` em texto simples de clientes Apple muito antigos) não podem resolver aprovações porque não contêm o GUID da mensagem; a resolução por reação exige os metadados estruturados de tapback emitidos pelos clientes macOS / iOS atuais.

  </Accordion>
</AccordionGroup>

## Gravações de configuração

O iMessage permite, por padrão, gravações de configuração iniciadas pelo canal (para `/config set|unset` quando `commands.config: true`).

Para desativar:

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

## Agregação de DMs com envio dividido (comando + URL em uma composição)

Quando um usuário digita um comando e uma URL juntos — por exemplo, `Dump https://example.com/article` — o app Mensagens da Apple divide o envio em **duas linhas `chat.db` separadas**:

1. Uma mensagem de texto (`"Dump"`).
2. Um balão de pré-visualização de URL (`"https://..."`) com imagens da pré-visualização OG como anexos.

As duas linhas chegam ao OpenClaw com um intervalo de aproximadamente 0.8-2.0 s na maioria das configurações. Sem agregação, o agente recebe apenas o comando no turno 1 (e frequentemente responde "envie a URL") antes de a URL chegar no turno 2. Isso faz parte do pipeline de envio da Apple, não é algo introduzido pelo OpenClaw ou por `imsg`.

`channels.imessage.coalesceSameSenderDms` permite que uma DM armazene em buffer linhas consecutivas do mesmo remetente. Quando `imsg` expõe o marcador estrutural de pré-visualização de URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` em uma das linhas de origem, o OpenClaw mescla somente esse envio realmente dividido e mantém quaisquer outras linhas armazenadas em buffer como turnos separados. Em builds mais antigos de `imsg`, que não emitem nenhum metadado de balão, o OpenClaw não consegue distinguir um envio dividido de envios separados e, portanto, recorre à mesclagem do conjunto. Isso preserva o comportamento anterior aos metadados, em vez de regredir envios divididos de `Dump <url>` para dois turnos. Os chats em grupo continuam sendo despachados por mensagem para preservar a estrutura de turnos com vários usuários.

<Tabs>
  <Tab title="Quando ativar">
    Ative quando:

    - Você disponibiliza Skills que esperam `command + payload` em uma única mensagem (despejar, colar, salvar, enfileirar etc.).
    - Seus usuários colam URLs junto com comandos.
    - Você pode aceitar a latência adicional nos turnos de DM (veja abaixo).

    Mantenha desativado quando:

    - Você precisa da menor latência possível para comandos de acionamento de uma única palavra em DMs.
    - Todos os seus fluxos usam comandos únicos, sem payloads enviados em seguida.

  </Tab>
  <Tab title="Ativação">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // ativação opcional (padrão: false)
        },
      },
    }
    ```

    Com o sinalizador ativado e sem um `messages.inbound.byChannel.imessage` explícito ou um `messages.inbound.debounceMs` global, a janela de debounce é ampliada para **7000 ms** (o padrão legado é 0 ms — sem debounce). A janela maior é necessária porque a cadência de envio dividido da pré-visualização de URL da Apple pode se estender por vários segundos enquanto o Messages.app emite a linha de pré-visualização.

    Para ajustar a janela manualmente:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms abrangem os atrasos observados na pré-visualização de URLs do Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Compensações">
    - **A mesclagem precisa exige metadados atuais no payload de `imsg`.** Quando `balloon_bundle_id` está presente, somente o envio realmente dividido é mesclado; a mesclagem de fallback sem metadados descrita acima é uma compatibilidade retroativa temporária, removida assim que `imsg` agregar os envios divididos na origem.
    - **Latência adicional para mensagens de DM.** Com o sinalizador ativado, toda DM (incluindo comandos de controle independentes e mensagens de acompanhamento com um único texto) aguarda até o fim da janela de debounce antes do despacho, caso uma linha de pré-visualização de URL esteja a caminho. As mensagens de chats em grupo continuam sendo despachadas imediatamente.
    - **A saída mesclada é limitada.** O texto mesclado é limitado a 4000 caracteres, com um marcador `…[truncated]` explícito; os anexos são limitados a 20; as entradas de origem são limitadas a 10 (a primeira e as mais recentes são mantidas além desse limite). Cada GUID de origem é registrado em `coalescedMessageGuids` para telemetria posterior.
    - **Somente DMs.** Os chats em grupo seguem para o despacho por mensagem, para que o bot permaneça responsivo quando várias pessoas estiverem digitando.
    - **Ativação opcional, por canal.** Outros canais (Discord, Slack, Telegram, WhatsApp, …) não são afetados. Configurações legadas do BlueBubbles que definem `channels.bluebubbles.coalesceSameSenderDms` devem migrar esse valor para `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Cenários e o que o agente vê

A coluna "Sinalizador ativado" mostra o comportamento em um build de `imsg` que emite `balloon_bundle_id`. Em builds mais antigos de `imsg`, que não emitem nenhum metadado de balão, as linhas abaixo marcadas como "Dois turnos" / "N turnos" recorrem, em vez disso, a uma mesclagem legada (um turno): o OpenClaw não consegue distinguir estruturalmente um envio dividido de envios separados e, portanto, preserva a mesclagem anterior aos metadados. A separação precisa é ativada assim que o build passa a emitir metadados de balão.

| O usuário compõe                                                   | `chat.db` produz                  | Sinalizador desativado (padrão)         | Sinalizador ativado + janela (imsg emite metadados de balão)                                       |
| ------------------------------------------------------------------ | ------------------------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (um envio)                                      | 2 linhas com intervalo de ~1 s             | Dois turnos do agente: "Dump" sozinho, depois a URL | Um turno: texto mesclado `Dump https://example.com`                                                |
| `Save this 📎image.jpg caption` (anexo + texto)                                 | 2 linhas sem metadados de balão de URL     | Dois turnos                             | Dois turnos após os metadados serem observados; um turno mesclado em sessões antigas/anteriores ao latch sem metadados |
| `/status` (comando independente)                          | 1 linha                                    | Despacho imediato                       | **Aguarda até o fim da janela e então despacha**                                                    |
| URL colada sozinha                                                 | 1 linha                                    | Despacho imediato                       | Aguarda até o fim da janela e então despacha                                                        |
| Texto + URL enviados deliberadamente como duas mensagens separadas, com minutos de intervalo | 2 linhas fora da janela | Dois turnos | Dois turnos (a janela expira entre eles)                                                             |
| Enxurrada rápida (>10 DMs pequenas dentro da janela)               | N linhas sem metadados de balão de URL     | N turnos                                | N turnos após os metadados serem observados; um turno mesclado e limitado em sessões antigas/anteriores ao latch sem metadados |
| Duas pessoas digitando em um chat em grupo                         | N linhas de M remetentes                   | M+ turnos (um por conjunto de remetente) | M+ turnos — chats em grupo não são agregados                                                        |

## Recuperação de entrada após a reinicialização de uma ponte ou do gateway

O iMessage recupera mensagens perdidas enquanto o gateway estava inativo e, ao mesmo tempo, suprime a "bomba de backlog" obsoleta que a Apple pode descarregar após uma recuperação de Push. O comportamento padrão está sempre ativado e se baseia na desduplicação de entrada.

- **Desduplicação de repetição.** Cada mensagem de entrada despachada é registrada por seu GUID da Apple no estado persistente do plugin (`imessage.inbound-dedupe`), reservada na ingestão e confirmada após o processamento (liberada em caso de falha transitória para que possa ser tentada novamente). Tudo que já tiver sido processado é descartado, em vez de ser despachado duas vezes. Isso permite que a recuperação repita mensagens de forma agressiva sem manter registros por mensagem.
- **Recuperação do período de inatividade.** Na inicialização, o monitor recupera o último rowid despachado de `chat.db` (um cursor persistente por conta) e o passa para `imsg watch.subscribe` como `since_rowid`, para que o imsg repita as linhas que chegaram enquanto o gateway estava inativo e depois acompanhe as mensagens ao vivo. A repetição é limitada às 500 linhas mais recentes e a mensagens com até aproximadamente 2 horas, e a desduplicação descarta tudo que já tiver sido processado.
- **Limite de idade para backlog obsoleto.** As linhas acima do limite de inicialização são realmente ao vivo; uma linha cuja data de envio seja mais de aproximadamente 15 minutos anterior à chegada pertence ao backlog descarregado pelo Push e é suprimida. As linhas repetidas (no limite ou abaixo dele) usam a janela de recuperação mais ampla, permitindo que uma mensagem perdida recentemente seja entregue sem incluir o histórico antigo.

A recuperação funciona tanto em configurações locais quanto remotas de `cliPath`, pois a repetição de `since_rowid` é executada pela mesma conexão RPC de `imsg`. A diferença está na janela: quando o gateway consegue ler `chat.db` (local), ele fixa o limite de rowid da inicialização, limita o intervalo de repetição e entrega mensagens perdidas com até algumas horas de idade. Por meio de um `cliPath` SSH remoto, ele não consegue ler o banco de dados; portanto, a repetição não tem limite e cada linha usa o limite de idade das mensagens ao vivo — ele ainda recupera mensagens perdidas recentemente e suprime o backlog antigo, mas com a janela menor das mensagens ao vivo. Execute o gateway no Mac com o Mensagens para obter a janela de recuperação mais ampla.

### Sinal visível para o operador

O backlog suprimido é registrado no nível padrão, nunca descartado silenciosamente (o sinalizador `recovery` mostra qual janela foi aplicada):

```text
imessage: backlog de entrada obsoleto suprimido account=<id> sent=<iso> recovery=<bool> (<N> suprimidos desde a inicialização)
```

### Migração

`channels.imessage.catchup.*` está obsoleto — a recuperação do período de inatividade é automática e não exige configuração em novas instalações. Configurações existentes com `catchup.enabled: true` continuam sendo respeitadas como um perfil de compatibilidade para a janela de repetição da recuperação. Blocos de recuperação desativados (`enabled: false` ou sem `enabled: true`) foram descontinuados; `openclaw doctor --fix` os remove.

## Solução de problemas

<AccordionGroup>
  <Accordion title="imsg não encontrado ou RPC sem suporte">
    Valide o binário e o suporte a RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Se a verificação informar que RPC não é compatível, atualize `imsg`. Se as ações de API privada não estiverem disponíveis, execute `imsg launch` na sessão do usuário conectado ao macOS e verifique novamente. Se o Gateway não estiver em execução no macOS, use a configuração de Mac remoto via SSH descrita acima, em vez do caminho local padrão de `imsg`.

  </Accordion>

  <Accordion title="As mensagens são enviadas, mas as iMessages recebidas não chegam">
    Primeiro, confirme se a mensagem chegou ao Mac local. Se `chat.db` não mudar, o OpenClaw não conseguirá receber a mensagem, mesmo quando `imsg status --json` indicar uma ponte íntegra.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Se as mensagens enviadas pelo telefone não criarem novas linhas, repare a camada do Mensagens do macOS e do Apple Push antes de alterar a configuração do OpenClaw. Uma atualização pontual do serviço geralmente é suficiente:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Envie uma nova iMessage pelo telefone e confirme uma nova linha `chat.db` ou um evento `imsg watch` antes de depurar as sessões do OpenClaw. Não execute isso como um loop periódico de reinicialização da ponte; reinicializações repetidas de `imsg launch` junto com reinicializações do Gateway durante o trabalho ativo podem interromper entregas e deixar execuções do canal em andamento sem continuidade.

  </Accordion>

  <Accordion title="O Gateway não está em execução no macOS">
    O `cliPath: "imsg"` padrão deve ser executado no Mac conectado ao Messages. No Linux ou Windows, defina `channels.imessage.cliPath` como um script wrapper que se conecta por SSH a esse Mac e executa `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Em seguida, execute:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="As mensagens diretas são ignoradas">
    Verifique:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprovações de pareamento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="As mensagens de grupo são ignoradas">
    Verifique:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` comportamento da lista de permissões
    - configuração do padrão de menção (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Falha nos anexos remotos">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticação por chave SSH/SCP no host do Gateway
    - a chave do host existe em `~/.ssh/known_hosts` no host do Gateway
    - a legibilidade do caminho remoto no Mac que executa o Mensagens

  </Accordion>

  <Accordion title="As solicitações de permissão do macOS foram ignoradas">
    Execute novamente em um terminal gráfico interativo no mesmo contexto de usuário/sessão e aprove as solicitações:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirme que Acesso Total ao Disco + Automação foram concedidos ao contexto do processo que executa o OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Referências da configuração

- [Referência de configuração — iMessage](/pt-BR/gateway/config-channels#imessage)
- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Emparelhamento](/pt-BR/channels/pairing)

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Remoção do BlueBubbles e o caminho do iMessage via imsg](/pt-BR/announcements/bluebubbles-imessage) — anúncio e resumo da migração
- [Migração do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) — tabela de tradução da configuração e transição passo a passo
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de emparelhamento
- [Grupos](/pt-BR/channels/groups) — comportamento de conversas em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção

---
read_when:
    - Você quer um guia passo a passo da TUI voltado para iniciantes
    - Você precisa da lista completa de recursos, comandos e atalhos da TUI
summary: 'Interface de usuário de terminal (TUI): conecte-se ao Gateway ou execute localmente no modo incorporado'
title: TUI
x-i18n:
    generated_at: "2026-07-12T15:47:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
    source_path: web/tui.md
    workflow: 16
---

## Início rápido

### Modo Gateway

1. Inicie o Gateway.

```bash
openclaw gateway
```

2. Abra a TUI.

```bash
openclaw tui
```

3. Digite uma mensagem e pressione Enter.

Gateway remoto:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Use `--password` se o Gateway usar autenticação por senha.

### Modo local

Execute a TUI sem um Gateway:

```bash
openclaw chat
# ou
openclaw tui --local
```

- `openclaw chat` e `openclaw terminal` são aliases de `openclaw tui --local`.
- `--local` não pode ser combinado com `--url`, `--token` ou `--password`.
- O modo local usa diretamente o runtime de agente incorporado. A maioria das ferramentas locais funciona, mas os recursos exclusivos do Gateway não estão disponíveis.
- `openclaw` sem argumentos (sem subcomando) escolhe um destino automaticamente: uma instalação não configurada inicia a integração guiada de inferência; uma configuração inválida abre as orientações clássicas do doctor; um Gateway configurado e acessível abre este shell da TUI no modo Gateway; caso contrário, um modelo local configurado o abre no modo local.

## O que você vê

- Cabeçalho: URL de conexão, agente atual e sessão atual.
- Registro do chat: mensagens do usuário, respostas do assistente, avisos do sistema e cartões de ferramentas.
- Linha de status: estado da conexão/execução (conectando, executando, transmitindo, ocioso, erro).
- Rodapé: agente + sessão + modelo + estado da meta + think/fast/verbose/trace/reasoning + contagens de tokens + entrega. Quando `tui.footer.showRemoteHost` está habilitado, as conexões remotas com o Gateway também mostram o host da conexão.
- Entrada: editor de texto com preenchimento automático.

## Modelo mental: agentes + sessões

- Os agentes são slugs exclusivos (por exemplo, `main`, `research`). O Gateway disponibiliza a lista.
- As sessões pertencem ao agente atual.
- As chaves de sessão são armazenadas como `agent:<agentId>:<sessionKey>`.
  - Se você digitar `/session main`, a TUI o expande para `agent:<currentAgent>:main`.
  - Se você digitar `/session agent:other:main`, alternará explicitamente para a sessão desse agente.
- Escopo da sessão:
  - `per-sender` (padrão): cada agente tem várias sessões.
  - `global`: a TUI sempre usa a sessão `global` (o seletor pode estar vazio).
- O agente e a sessão atuais estão sempre visíveis no rodapé.
- Para mostrar o host do Gateway em conexões não locais baseadas em URL, habilite explicitamente com:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  O padrão é `false`. Conexões locais de loopback e incorporadas nunca exibem um rótulo de host.

- Se a sessão tiver um [objetivo](/pt-BR/tools/goal), o rodapé mostrará seu estado compacto:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` ou `Goal achieved`.
- Quando iniciada sem `--session`, a TUI no modo Gateway retomará a última sessão selecionada para o mesmo Gateway, agente e escopo de sessão, se essa sessão ainda existir. O uso de `--session`, `/session`, `/new` ou `/reset` continuará sendo explícito.

## Envio + entrega

- As mensagens sempre vão para o Gateway (ou para o runtime incorporado no modo local); entregar a resposta do assistente de volta a um provedor de chat é uma etapa separada, desativada por padrão.
- A TUI é uma superfície de origem interna, como o WebChat, e não um canal de saída genérico. Harnesses que exigem `tools.message` para respostas visíveis podem atender ao turno ativo da TUI com um `message.send` sem destino; a entrega explícita ao provedor continua usando os canais configurados normalmente e nunca recorre a `lastChannel`.
- A entrega é definida na inicialização para toda a sessão da TUI: inicie com `openclaw tui --deliver` para ativá-la. Não há um comando de barra `/deliver` nem um controle em Configurações para alterá-la durante a sessão; reinicie a TUI para mudar essa configuração.

## Seletores + sobreposições

- Seletor de modelo: lista os modelos disponíveis e define a substituição da sessão.
- Seletor de agente: escolhe um agente diferente.
- Seletor de sessão: mostra até 50 sessões do agente atual, atualizadas nos últimos 7 dias. Use `/session <key>` para acessar uma sessão conhecida mais antiga.
- Configurações (`/settings`): alterna a expansão da saída das ferramentas e a visibilidade do raciocínio. Este painel não controla a entrega.

## Atalhos de teclado

- Enter: enviar mensagem
- Esc: interromper a execução ativa
- Ctrl+C: limpar a entrada (pressione duas vezes para sair)
- Ctrl+D: sair
- Ctrl+L: seletor de modelo
- Ctrl+G: seletor de agente
- Ctrl+P: seletor de sessão
- Ctrl+O: alternar a expansão da saída das ferramentas
- Ctrl+T: alternar a visibilidade do raciocínio (recarrega o histórico)

## Comandos de barra

Núcleo:

- `/help`
- `/status` (encaminhado pelo Gateway; mostra um resumo da sessão/do modelo)
- `/gateway-status` (alias `/gwstatus`; mostra diretamente o status da conexão com o Gateway)
- `/agent <id>` (ou `/agents`)
- `/session <key>` (ou `/sessions`)
- `/model <provider/model>` (ou `/models`)

Controles da sessão:

- `/think <off|minimal|low|medium|high>` (níveis mais altos podem adicionar opções como `xhigh`/`max`, dependendo do modelo)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` remove a substituição definida para a sessão)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Ciclo de vida da sessão:

- `/new` (cria uma nova sessão isolada com uma nova chave; não afeta outros clientes TUI na sessão antiga)
- `/reset` (redefine a chave da sessão atual no mesmo lugar)
- `/abort` (interrompe a execução ativa)
- `/settings`
- `/exit` (ou `/quit`)

Somente no modo local:

- `/auth [provider]` abre o fluxo de autenticação/login do provedor dentro da TUI.

Crestodian:

- `/crestodian [request]` retorna da TUI normal do agente para o chat de configuração/reparo do [Crestodian](#crestodian-setup-and-repair-helper), encaminhando opcionalmente uma solicitação.

Outros comandos de barra do Gateway (por exemplo, `/context`) são encaminhados ao Gateway e exibidos como saída do sistema. Consulte [Comandos de barra](/pt-BR/tools/slash-commands).

## Comandos do shell local

- Adicione `!` no início de uma linha para executar um comando do shell local no host da TUI.
- A TUI solicita uma vez por sessão a permissão para execução local; se você recusar, `!` permanecerá desativado durante a sessão.
- Os comandos são executados em um shell novo e não interativo no diretório de trabalho da TUI (sem `cd`/variáveis de ambiente persistentes).
- Os comandos do shell local recebem `OPENCLAW_SHELL=tui-local` em seu ambiente.
- Um `!` isolado é enviado como uma mensagem normal; espaços iniciais não acionam a execução local.

## Assistente de configuração e reparo Crestodian

Crestodian é o assistente de configuração/reparo de nível zero, disponibilizado como `openclaw crestodian` depois que o modelo padrão configurado passa por uma verificação de inferência em tempo real. Se a inferência não estiver disponível, uma invocação interativa retorna à integração inicial de inferência, e a automação falha com orientações de reparo. Ele é executado no mesmo shell TUI local que `openclaw tui --local`, com o suporte de um agente de IA restrito às operações tipadas do Crestodian, sujeitas a aprovação:

```bash
openclaw crestodian                       # iniciar interativamente
openclaw crestodian -m "status"           # executar uma solicitação e sair
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # aplicar uma gravação de configuração
```

- Gravações persistentes de configuração precisam de aprovação: confirme interativamente ou passe `--yes`.
- `--json` imprime a visão geral da inicialização como JSON em vez de iniciar o chat.
- De dentro do Crestodian, uma solicitação `open-tui` (por exemplo, pedir para conversar com um agente normal) encerra o Crestodian e abre a TUI normal do agente; use `/crestodian` nela para voltar.

Use o modo local quando a configuração atual já for validada e você quiser que o agente integrado a inspecione na mesma máquina, compare-a com a documentação e ajude a corrigir divergências sem depender de um Gateway em execução.

Se `openclaw config validate` já estiver falhando, comece primeiro com `openclaw configure` ou `openclaw doctor --fix`; `openclaw chat` ainda precisa de uma configuração que possa ser carregada para iniciar.

Fluxo típico:

1. Inicie o modo local:

```bash
openclaw chat
```

2. Peça ao agente que verifique o que você deseja, por exemplo:

```text
Compare minha configuração de autenticação do gateway com a documentação e sugira a menor correção possível.
```

3. Use comandos locais do shell para obter evidências exatas e fazer a validação:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Aplique alterações pontuais com `openclaw config set` ou `openclaw configure` e execute novamente `!openclaw config validate`.
5. Se o Doctor recomendar uma migração ou correção automática, revise-a e execute `!openclaw doctor --fix`.

Dicas:

- Prefira `openclaw config set` ou `openclaw configure` em vez de editar `openclaw.json` manualmente.
- `openclaw docs "<query>"` pesquisa o índice da documentação em produção na mesma máquina.
- `openclaw config validate --json` é útil quando você precisa de erros estruturados de esquema e de SecretRef/resolução.

## Saída das ferramentas

- As chamadas de ferramentas aparecem como cartões com argumentos + resultados.
- Ctrl+O alterna entre as visualizações recolhida/expandida.
- Enquanto as ferramentas são executadas, atualizações parciais são transmitidas para o mesmo cartão.

## Cores do terminal

- A TUI mantém o texto principal do assistente na cor de primeiro plano padrão do seu terminal, para que terminais claros e escuros permaneçam legíveis.
- Se o terminal usa um fundo claro e a detecção automática está incorreta, defina `OPENCLAW_THEME=light` antes de iniciar `openclaw tui`.
- Para forçar a paleta escura original, defina `OPENCLAW_THEME=dark`.

## Histórico + transmissão

- Ao se conectar, a TUI carrega o histórico mais recente (por padrão, 200 mensagens).
- As respostas transmitidas são atualizadas no lugar até serem finalizadas.
- A TUI também monitora eventos de ferramentas do agente para exibir cartões de ferramentas mais completos.

## Detalhes da conexão

- A TUI se conecta com o id de cliente `openclaw-tui` no modo de cliente amplo `ui` (o mesmo modo usado pela Control UI e pelo WebChat para a política do Gateway).
- As reconexões exibem uma mensagem do sistema; lacunas de eventos são indicadas no log.

## Opções

- `--local`: Executa no runtime local integrado do agente
- `--url <url>`: URL WebSocket do Gateway (o padrão é `gateway.remote.url` da configuração ou `ws://127.0.0.1:<port>` no loopback)
- `--token <token>`: Token do Gateway (se necessário)
- `--password <password>`: Senha do Gateway (se necessária)
- `--tls-fingerprint <sha256>`: Impressão digital esperada do certificado TLS para um Gateway `wss://` fixado
- `--session <key>`: Chave da sessão (padrão: `main`, ou `global` quando o escopo é global)
- `--deliver`: Entrega as respostas do assistente ao provedor (desativado por padrão)
- `--thinking <level>`: Substitui o nível de raciocínio dos envios
- `--message <text>`: Envia uma mensagem inicial após a conexão
- `--timeout-ms <ms>`: Tempo limite do agente em ms (o padrão é `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entradas do histórico a serem carregadas (padrão: `200`)

<Warning>
Quando você define `--url`, a TUI não recorre às credenciais da configuração nem às variáveis de ambiente. Passe `--token` ou `--password` explicitamente, além de `--tls-fingerprint` quando o destino usar um certificado fixado. A ausência de credenciais explícitas é um erro. No modo local, não passe `--url`, `--token`, `--password` nem `--tls-fingerprint`.
</Warning>

## Solução de problemas

Nenhuma saída após enviar uma mensagem:

- Execute `/status` na TUI para confirmar que o Gateway está conectado e ocioso/ocupado.
- Verifique os logs do Gateway: `openclaw logs --follow`.
- Confirme que o agente pode ser executado: `openclaw status` e `openclaw models status`.
- Se você espera mensagens em um canal de chat, confirme que a TUI foi iniciada com `--deliver` (não é possível ativar essa opção posteriormente sem reiniciar).

## Solução de problemas de conexão

- `disconnected`: verifique se o Gateway está em execução e se seus valores de `--url/--token/--password` estão corretos.
- Nenhum agente no seletor: verifique `openclaw agents list` e sua configuração de roteamento.
- Seletor de sessão vazio: talvez você esteja no escopo global ou ainda não tenha sessões.

## Relacionados

- [Control UI](/pt-BR/web/control-ui) — interface de controle baseada na web
- [Configuração](/pt-BR/cli/config) — inspecione, valide e edite `openclaw.json`
- [Doctor](/pt-BR/cli/doctor) — verificações guiadas de reparo e migração
- [Referência da CLI](/pt-BR/cli) — referência completa dos comandos da CLI

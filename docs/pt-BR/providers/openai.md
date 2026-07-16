---
read_when:
    - Você quer usar modelos da OpenAI no OpenClaw
    - Você quer usar a autenticação da assinatura do Codex em vez de chaves de API
    - Você precisa de um comportamento de execução de agentes GPT-5 mais rigoroso
summary: Use a OpenAI por meio de chaves de API ou de uma assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T12:54:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw usa um único id de provedor, `openai`, tanto para autenticação direta por chave de API quanto para
autenticação de assinatura do ChatGPT/Codex. `openai/*` é a rota de modelo canônica.
Para turnos de agentes incorporados com a política de runtime não definida ou definida como `auto`, os dados
da rota da OpenAI determinam se o OpenClaw pode selecionar implicitamente o runtime
incluído do servidor de aplicativo Codex. O prefixo `openai/*`, por si só, não seleciona um runtime.

- **Modelos de agente** - `openai/*` por meio do runtime selecionado pela configuração
  explícita `agentRuntime` ou pela política de rota implícita da OpenAI. Entre com a autenticação do Codex
  para usar uma assinatura do ChatGPT/Codex ou configure um perfil de autenticação por chave
  de API quando quiser cobrança baseada em chave.
- **APIs da OpenAI não relacionadas a agentes** - acesso direto à OpenAI Platform, com cobrança por uso,
  por meio de `OPENAI_API_KEY` ou de um perfil de autenticação por chave de API `openai`.
- **Configuração legada** - as referências `codex/*` e `openai-codex/*` são corrigidas para
  `openai/*`, com `agentRuntime.id: "codex"` com escopo de modelo, por
  `openclaw doctor --fix`.

A OpenAI oferece suporte explícito ao uso de OAuth de assinatura em ferramentas
e fluxos de trabalho externos, como o OpenClaw.

## Acompanhamento de uso e custos

O OpenClaw mantém separadas a cota da assinatura e a cobrança da API da Platform:

- O OAuth do ChatGPT/Codex mostra o plano de assinatura, as janelas de cota e o saldo de créditos.
- `OPENAI_ADMIN_KEY` mostra 30 dias de custos da organização e uso de conclusões informados pelo provedor na seção **Uso** da Control UI, incluindo gastos diários, totais de solicitações/tokens, principais modelos e categorias de custos.
- `OPENAI_PROJECT_ID` restringe opcionalmente o histórico da Admin API a um único projeto.
- O OpenClaw nunca envia `OPENAI_API_KEY` nem um perfil de inferência `openai` às APIs da organização; essas credenciais podem pertencer a endpoints personalizados, do Azure ou locais do agente.

Uma chave de administrador explícita tem precedência sobre o OAuth. O histórico informado pelo provedor não é mesclado ao custo estimado pelo OpenClaw com base nas sessões; ele pode incluir atividades da API de outros clientes e ajustes de cobrança feitos pelo provedor.

A documentação do [Painel de uso da API](https://help.openai.com/en/articles/10478918) da OpenAI descreve os requisitos de proprietário da organização e de permissão explícita no Painel de uso para acessar dados de uso.

Provedor, modelo, runtime e canal são camadas separadas. Se esses rótulos
estiverem sendo confundidos, leia [Runtimes de agentes](/pt-BR/concepts/agent-runtimes) antes de
alterar a configuração.

## Escolha rápida

| Objetivo                                          | Use                                                                | Observações                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Assinatura do ChatGPT/Codex, runtime nativo do Codex | `openai/gpt-5.6-sol`                                               | Nova configuração de assinatura; entre com a autenticação do Codex. |
| Cobrança direta por chave de API para turnos de agentes | `openai/gpt-5.6` mais um perfil ordenado de autenticação por chave de API | Nova configuração por chave de API; o id da API direta sem qualificador é resolvido como Sol. |
| Escolher uma categoria exata do GPT-5.6           | `openai/gpt-5.6-sol`, `-terra` ou `-luna`                         | Verifique `models list` para saber quais categorias estão disponíveis para esta conta. |
| Conta sem acesso ao GPT-5.6                       | `openai/gpt-5.5`                                                   | Opção explícita de recuperação; o OpenClaw não faz downgrade silencioso. |
| Cobrança direta por chave de API, runtime explícito do OpenClaw | `openai/gpt-5.6` mais o provedor/modelo `agentRuntime.id: "openclaw"` | Selecione um perfil normal de chave de API `openai`. |
| Alias do modelo ChatGPT Instant mais recente      | `openai/chat-latest`                                               | Somente chave de API direta; alias variável, não o padrão estável. |
| Geração ou edição de imagens                      | `openai/gpt-image-2`                                               | Funciona com `OPENAI_API_KEY` ou OAuth do Codex. |
| Imagens com fundo transparente                    | `openai/gpt-image-1.5`                                             | Defina `outputFormat` como `png` ou `webp` e `background=transparent`. |

## Mapa de nomes

| Nome exibido                            | Camada             | Significado                                                                                  |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Prefixo do provedor | Rota de modelo canônica da OpenAI; os dados da rota determinam o runtime implícito. |
| Plugin `codex`                         | Plugin            | Plugin incluído que fornece o runtime nativo do servidor de aplicativo Codex e os controles de chat `/codex`. |
| provedor/modelo `agentRuntime.id: codex` | Runtime do agente | Força o ambiente nativo do servidor de aplicativo Codex para turnos incorporados correspondentes. |
| `/codex ...`                            | Conjunto de comandos de chat | Vincula/controla threads do servidor de aplicativo Codex em uma conversa. |
| `runtime: "acp", agentId: "codex"`      | Rota de sessão ACP | Caminho alternativo explícito que executa o Codex por meio de ACP/acpx. |

## Runtime implícito do agente

Quando a política `agentRuntime` do provedor/modelo não está definida ou é `auto`, a
política de rota pertencente ao provedor da OpenAI escolhe o runtime implícito com base no
endpoint e no adaptador efetivos:

| Dados efetivos da rota                                                                                                                                                  | Runtime implícito      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Endpoint HTTPS oficial exato da Platform com `openai-responses` ou endpoint HTTPS oficial exato do ChatGPT com `openai-chatgpt-responses`; sem substituição de solicitação definida pelo autor | O Codex pode ser selecionado |
| Adaptador `openai-completions` definido pelo autor                                                                                                                                  | OpenClaw              |
| Endpoint personalizado                                                                                                                                                 | OpenClaw              |
| Endpoint oficial exato configurado explicitamente com HTTP                                                                                                              | Rejeitado             |
| Rota com uma substituição de solicitação de provedor/modelo definida pelo autor                                                                                          | OpenClaw              |

Uma configuração explícita e não padrão de `agentRuntime.id` do provedor/modelo continua sendo autoritativa.
Por exemplo, `agentRuntime.id: "openclaw"` mantém no OpenClaw uma rota que, de outro modo, seria elegível
para o Codex, enquanto `agentRuntime.id: "codex"` exige o Codex e falha
de forma fechada quando a rota efetiva não é declarada compatível com o Codex.
A seleção do runtime não altera o tipo de credencial nem a cobrança: a autenticação por chave de API
da Platform e a autenticação por assinatura do ChatGPT/Codex permanecem distintas.

`openclaw doctor --fix` migra referências de modelo legadas `codex/*` e `openai-codex/*`,
ids legados de perfis de autenticação do Codex e entradas legadas de ordem de autenticação do Codex para a
rota canônica `openai`. As referências de modelo migradas recebem
`agentRuntime.id: "codex"` com escopo de modelo; use `auth.order.openai` para novas configurações de ordem de autenticação.

<Note>
Uma nova configuração da OpenAI aplica um modelo principal GPT-5.6 somente quando nenhum modelo principal está
configurado. Adicionar ou atualizar a autenticação da OpenAI preserva uma seleção explícita
existente, incluindo `openai/gpt-5.5`, a menos que você use explicitamente
`models auth login --set-default` ou `models set`. Use um perfil de autenticação por chave de API
somente quando quiser autenticação por chave de API para um modelo de agente.
</Note>

## Prévia limitada do GPT-5.6

O OpenClaw reconhece os ids de modelo exatos `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` e `openai/gpt-5.6-luna`. Os três oferecem raciocínio
`xhigh` e `max` no catálogo atual. A OpenAI descreve o Sol como
a categoria principal, o Terra como a categoria equilibrada e o Luna como a categoria rápida
e de menor custo. Consulte o
[anúncio de lançamento do GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
e o [guia de acesso](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Com autenticação direta por chave de API da OpenAI, o id `openai/gpt-5.6` sem qualificador é um alias do
Sol e o padrão para novas configurações. O catálogo nativo do Codex não aplica
esse alias da API direta no lado do cliente; dependendo do acesso ao workspace, ele pode mostrar
os ids exatos de Sol, Terra e Luna. Portanto, uma nova configuração de OAuth do ChatGPT/Codex
usa `openai/gpt-5.6-sol`. Verifique a conta atual com:

```bash
openclaw models list --provider openai
```

O acesso da organização da API e do workspace do Codex pode ser diferente. Se o GPT-5.6 não estiver
disponível, selecione explicitamente o GPT-5.5:

```bash
openclaw models set openai/gpt-5.5
```

O OpenClaw exibe o erro de acesso do serviço upstream e não substitui silenciosamente uma
seleção do GPT-5.6 pelo GPT-5.5.

<Note>
Rotas HTTPS oficiais exatas e elegíveis podem selecionar o Plugin incluído do servidor de aplicativo
Codex quando a política de runtime não está definida ou é `auto`; rotas de Completions definidas pelo autor,
endpoints personalizados e substituições de transporte de solicitações permanecem no OpenClaw. Endpoints
HTTP oficiais em texto simples são rejeitados. A configuração explícita do runtime do provedor/modelo continua sendo
autoritativa. Execute `openclaw doctor --fix` para corrigir referências legadas e obsoletas do modelo Codex,
referências `codex-cli/*` ou fixações antigas de sessões de runtime que não foram definidas por
uma configuração explícita de runtime.
</Note>

## Cobertura de recursos do OpenClaw

| Recurso da OpenAI         | Superfície do OpenClaw                                                                              | Status                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Chat / Responses          | provedor de modelos `openai/<model>`                                                               | Sim                                                             |
| Modelos da assinatura Codex | `openai/<model>` com OAuth da OpenAI                                                            | Sim                                                             |
| Referências de modelos Codex legadas   | referências antigas de modelos Codex, `codex-cli/<model>`                                                     | Corrigidas pelo doctor para `openai/<model>`                          |
| Harness do app-server Codex  | rota HTTPS compatível com Codex com runtime não definido/`auto`, ou `agentRuntime.id: codex` explícito  | Sim                                                             |
| Pesquisa na web do lado do servidor    | Ferramenta nativa Responses da OpenAI                                                                  | Sim, quando a pesquisa na web está habilitada e nenhum outro provedor está fixado |
| Imagens                    | `image_generate`                                                                              | Sim                                                             |
| Vídeos                    | `video_generate`                                                                              | Sim                                                             |
| Texto para fala            | `messages.tts.provider: "openai"` / `tts`                                                     | Sim                                                             |
| Fala para texto em lote      | `tools.media.audio` / compreensão de mídia                                                     | Sim                                                             |
| Fala para texto por streaming  | Voice Call `streaming.provider: "openai"`                                                     | Sim                                                             |
| Voz em tempo real            | Voice Call `realtime.provider: "openai"` / Conversa da Control UI `talk.realtime.provider: "openai"` | Sim (chave de API da OpenAI Platform)                                   |
| Embeddings                | provedor de embeddings de memória                                                                     | Sim                                                             |

<Note>
A voz em tempo real da OpenAI passa pela **API Realtime pública da OpenAI
Platform** e exige uma chave de API da Platform. Os tokens OAuth do Codex autenticam
o backend ChatGPT Codex; eles não são intercambiáveis com chaves de API da Platform
para os endpoints Realtime públicos.

Se a autenticação por chave de API informar que não há faturamento, adicione créditos da Platform em
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
para a organização associada às suas credenciais de tempo real ao usar autenticação
por chave de API. A voz em tempo real aceita o perfil de autenticação por chave de API `openai` criado por
`openclaw onboard --auth-choice openai-api-key`, uma chave de API da Platform definida por meio de
`talk.realtime.providers.openai.apiKey` para a Conversa da Control UI, ou
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` para Voice
Call, ou a variável de ambiente `OPENAI_API_KEY`.
</Note>

## Embeddings de memória

O OpenClaw pode usar a OpenAI, ou um endpoint de embeddings compatível com a OpenAI, para
indexação de `memory_search` e embeddings de consulta:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Para endpoints compatíveis com a OpenAI que exigem rótulos de embeddings assimétricos, defina
`queryInputType` e `documentInputType` em `memorySearch`. O OpenClaw
os encaminha como campos de solicitação `input_type` específicos do provedor: os embeddings
de consulta usam `queryInputType`; os fragmentos de memória indexados e a indexação em lote usam
`documentInputType`. Consulte a
[referência de configuração de memória](/pt-BR/reference/memory-config#provider-specific-config)
para ver o exemplo completo.

## Introdução

<Tabs>
  <Tab title="Chave de API (OpenAI Platform)">
    **Ideal para:** acesso direto à API e faturamento baseado no uso.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API no [painel da OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Execute a integração inicial">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou forneça a chave diretamente:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Resumo das rotas

    | Referência do modelo        | Política de runtime ou fatos da rota                                 | Rota                     | Autenticação                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | não definido/`auto`, rota HTTPS nativa oficial exata, sem substituição na solicitação | O Codex pode ser selecionado     | Perfil de autenticação por chave de API ordenado      |
    | `openai/gpt-5.6` | provedor/modelo `agentRuntime.id: "openclaw"`                  | Runtime integrado do OpenClaw | Perfil de chave de API `openai` selecionado |
    | `openai/gpt-5.5` | provedor/modelo explícito `agentRuntime.id`                     | Runtime do agente selecionado    | Perfil de chave de API da OpenAI selecionado   |
    | `openai/*`       | Completions definidas, personalizadas ou substituição na solicitação | Runtime integrado do OpenClaw | O tipo de credencial permanece inalterado |
    | `openai/*`       | endpoint HTTP oficial em texto simples                  | Rejeitada                 | A credencial não é enviada             |

    <Note>
    Com o runtime não definido ou `auto`, somente uma rota HTTPS nativa
    oficial exata e qualificada pode selecionar implicitamente o harness do app-server Codex. Para autenticação por chave de API
    em um modelo de agente, crie um perfil de autenticação por chave de API `openai` e ordene-o com
    `auth.order.openai`; `OPENAI_API_KEY` permanece como fallback direto para
    superfícies não relacionadas a agentes da API da OpenAI. Execute `openclaw doctor --fix` para migrar entradas
    antigas da ordem de autenticação legada do Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    O ID `gpt-5.6` básico da API direta é resolvido para o nível Sol. Se esta organização
    da API não disponibilizar o GPT-5.6, defina explicitamente o modelo primário como
    `openai/gpt-5.5`.

    Para experimentar o modelo Instant atual do ChatGPT por meio da API da OpenAI, defina o modelo
    como `openai/chat-latest`:

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` é um alias variável. Em vez disso, uma nova configuração com chave de API da OpenAI usa
    `openai/gpt-5.6`, cujo ID básico da API direta é resolvido para Sol. Modelos primários
    explícitos existentes, incluindo `openai/gpt-5.5`, permanecem inalterados. O
    alias `chat-latest` aceita apenas a verbosidade de texto `medium`; o OpenClaw força
    qualquer outra verbosidade solicitada para `medium` nesse modelo.

    <Warning>
    O OpenClaw **não** disponibiliza `gpt-5.3-codex-spark` na rota direta
    com chave de API da OpenAI. Ele está disponível apenas por meio das entradas do catálogo da assinatura Codex
    quando sua conta conectada o disponibiliza.
    </Warning>

  </Tab>

  <Tab title="Assinatura Codex">
    **Ideal para:** usar sua assinatura ChatGPT/Codex com execução nativa do
    app-server Codex em vez de uma chave de API separada. O Codex na nuvem exige
    login no ChatGPT.

    <Steps>
      <Step title="Execute o OAuth do Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Ou execute o OAuth diretamente:

        ```bash
        openclaw models auth login --provider openai
        ```

        Para configurações sem interface gráfica ou incompatíveis com callbacks, adicione `--device-code` para fazer
        login com um fluxo de código de dispositivo do ChatGPT em vez do callback do navegador
        local:

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Use a rota canônica do modelo OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        Nenhuma configuração de runtime é necessária para esta rota HTTPS nativa
        oficial exata. Ela pode selecionar automaticamente o runtime do app-server Codex, e
        o OpenClaw instala ou corrige o Plugin Codex integrado quando esse runtime
        é escolhido.
      </Step>
      <Step title="Verifique se a autenticação do Codex está disponível">
        ```bash
        openclaw models list --provider openai
        ```

        Depois que o Gateway estiver em execução, envie `/codex status` ou `/codex models`
        no chat para verificar o runtime nativo do app-server.
      </Step>
    </Steps>

    ### Resumo das rotas

    | Referência do modelo                | Política de runtime ou fatos da rota                                 | Rota                                                    | Autenticação                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | não definido/`auto`, rota HTTPS nativa oficial exata, sem substituição na solicitação | O Codex pode ser selecionado                                    | Login no Codex ou um perfil de autenticação `openai` ordenado |
    | `openai/gpt-5.6-terra`   | não definido/`auto`, rota HTTPS nativa oficial exata, sem substituição na solicitação | O Codex pode ser selecionado                                    | Login no Codex quando o catálogo disponibiliza Terra       |
    | `openai/gpt-5.6-luna`    | não definido/`auto`, rota HTTPS nativa oficial exata, sem substituição na solicitação | O Codex pode ser selecionado                                    | Login no Codex quando o catálogo disponibiliza Luna        |
    | `openai/gpt-5.6-sol`     | provedor/modelo `agentRuntime.id: "openclaw"`                  | Runtime integrado do OpenClaw, transporte interno de autenticação Codex | Perfil OAuth `openai` selecionado                    |
    | `openai/gpt-5.5`         | provedor/modelo explícito `agentRuntime.id`                     | Runtime do agente selecionado                                   | Perfil de autenticação da OpenAI selecionado                       |
    | `openai/*`               | Completions definidas, personalizadas ou substituição na solicitação | Runtime integrado do OpenClaw                                | O requisito de credencial permanece específico da rota      |
    | `openai/*`               | endpoint HTTP oficial em texto simples                  | Rejeitada                                                 | A credencial não é enviada                              |
    | Referência legada do Codex GPT-5.5 | corrigida pelo doctor                                            | Reescrita como `openai/gpt-5.5`                            | Perfil OAuth da OpenAI migrado                      |
    | `codex-cli/gpt-5.5`      | corrigida pelo doctor                                            | Reescrita como `openai/gpt-5.5`                            | Autenticação do app-server Codex                              |

    <Warning>
    A configuração nova com suporte por assinatura usa exatamente `openai/gpt-5.6-sol`; o
    catálogo nativo do Codex também pode expor referências exatas do Terra ou Luna. Se a
    conta não expuser o GPT-5.6, selecione `openai/gpt-5.5` explicitamente. Referências
    mais antigas do Codex GPT são rotas legadas do OpenClaw, não o caminho do runtime
    nativo do Codex; execute `openclaw doctor --fix` para migrá-las sem atualizar uma
    seleção explícita existente do GPT-5.5. `gpt-5.3-codex-spark` permanece limitado
    a contas cujo catálogo da assinatura do Codex o anuncia; referências diretas por
    chave de API da OpenAI e do Azure para ele permanecem ocultas.
    </Warning>

    <Note>
    A nova configuração deve colocar a ordem de autenticação do agente OpenAI em `auth.order.openai`;
    o doctor migra entradas mais antigas da ordem de autenticação legada do Codex.
    </Note>

    ### Exemplo de configuração

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    Com uma chave de API de backup, mantenha o modelo selecionado em `openai/*` e coloque
    a ordem de autenticação em `openai`. O OpenClaw tenta primeiro a assinatura e depois
    a chave de API, permanecendo no harness do Codex:

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    A integração inicial não importa mais material OAuth de `~/.codex`. Entre com
    OAuth pelo navegador (padrão) ou com o fluxo de código de dispositivo acima; o OpenClaw gerencia as
    credenciais resultantes no próprio armazenamento de autenticação do agente.
    </Note>

    ### Verificar e recuperar o roteamento OAuth do Codex

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Para um agente específico, adicione `--agent <id>`:

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Se uma configuração mais antiga ainda tiver referências legadas do Codex GPT ou uma fixação obsoleta
    de sessão do runtime OpenAI sem configuração explícita do runtime, corrija-a:

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Se `models auth list --provider openai` não mostrar nenhum perfil utilizável, entre
    novamente:

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Use `--profile-id` para vários logins OAuth do Codex no mesmo agente e depois
    controle-os pela ordem de autenticação ou por `/model ...@<profileId>`:

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Execute `openclaw doctor --fix` para migrar IDs de perfil e entradas de ordem mais antigos
    com o prefixo legado OpenAI Codex antes de depender da ordenação dos perfis.

    ### Indicador de status

    O `/status` do chat mostra qual runtime de modelo está ativo para a sessão
    atual. O harness app-server integrado do Codex aparece como
    `Runtime: OpenAI Codex` quando uma rota implícita qualificada ou uma política explícita
    de runtime de provedor/modelo o seleciona.

    ### Aviso do doctor

    Se referências legadas de modelo do Codex ou fixações obsoletas do runtime OpenAI permanecerem na configuração
    ou no estado da sessão, `openclaw doctor --fix` as reescreve como `openai/*` com
    o runtime do Codex, a menos que o OpenClaw esteja configurado explicitamente.

    ### Limite da janela de contexto

    O OpenClaw trata os metadados do modelo e o limite de contexto do runtime como valores
    separados. Para `openai/gpt-5.5` por meio do catálogo OAuth do Codex:

    - `contextWindow` nativo: `400000`
    - Limite padrão de `contextTokens` do runtime: `272000`

    Na prática, o limite padrão menor apresenta melhores características de latência e
    qualidade. Substitua-o com `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Use `contextWindow` para declarar metadados nativos do modelo. Use `contextTokens`
    para limitar o orçamento de contexto do runtime. A rota direta por chave de API da OpenAI
    informa um `contextWindow` nativo maior (`1000000`) para `gpt-5.5`; as duas
    rotas são monitoradas separadamente porque os catálogos upstream são diferentes.
    </Note>

    ### Recuperação do catálogo

    O OpenClaw usa metadados upstream do catálogo do Codex para `gpt-5.5` quando estão
    presentes. Se a descoberta em tempo real do Codex omitir a linha `gpt-5.5` enquanto a conta
    estiver autenticada, o OpenClaw sintetiza essa linha de modelo OAuth para que execuções de cron,
    subagente e modelo padrão configurado não falhem com
    `Unknown model`.

  </Tab>
</Tabs>

## Autenticação nativa do app-server do Codex

O harness nativo do app-server do Codex usa referências de modelo `openai/*` quando uma rota
HTTPS oficial exata e qualificada o seleciona implicitamente ou quando `agentRuntime.id: "codex"`
do provedor/modelo o seleciona explicitamente. Sua autenticação ainda é
baseada em conta. O OpenClaw seleciona a autenticação nesta ordem:

1. Perfis de autenticação OpenAI ordenados para o agente, de preferência em
   `auth.order.openai`. Execute `openclaw doctor --fix` para migrar IDs de perfil de
   autenticação legados do Codex e a ordem de autenticação.
2. A conta existente do app-server, como um login local do ChatGPT
   na CLI do Codex. Para o diretório inicial isolado padrão do agente, o OpenClaw conecta essa conta
   nativa da CLI ao app-server por meio do RPC de login; ele não compartilha a
   configuração, os plugins nem o armazenamento de threads da CLI.
3. Somente para inicializações locais do app-server por stdio e apenas quando o app-server
   não informar nenhuma conta: `CODEX_API_KEY` e depois `OPENAI_API_KEY`.

Um login local de assinatura do ChatGPT/Codex não é substituído apenas porque o
processo do Gateway também tem `OPENAI_API_KEY` para modelos diretos da OpenAI ou
embeddings. O fallback de chave de API do ambiente se aplica somente ao caminho local por stdio
sem conta; ele nunca é enviado por conexões WebSocket do app-server. Quando um
perfil do Codex baseado em assinatura é selecionado, o OpenClaw também mantém
`CODEX_API_KEY` e `OPENAI_API_KEY` fora do processo filho do app-server por stdio
e envia as credenciais selecionadas por meio do RPC de login do app-server.

Quando esse perfil de assinatura é bloqueado por um limite de uso do Codex, o OpenClaw
marca o perfil como bloqueado até o horário de redefinição anunciado pelo Codex e permite que a ordem de
autenticação alterne para o próximo perfil `openai:*`, sem mudar o modelo
selecionado nem sair do harness do Codex. Depois que o horário de redefinição passa, o
perfil de assinatura volta a ser elegível.

## Geração de imagens

O plugin integrado `openai` registra a geração de imagens por meio da
ferramenta `image_generate`. Ele oferece geração de imagens tanto por chave de API
da OpenAI quanto por OAuth do Codex usando a mesma referência de modelo `openai/gpt-image-2`.

| Capacidade                 | Chave de API da OpenAI              | OAuth do Codex                         |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Referência do modelo      | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Autenticação              | `OPENAI_API_KEY`                   | Login OAuth do OpenAI Codex            |
| Transporte                | API de imagens da OpenAI           | Backend Responses do Codex             |
| Máximo de imagens por solicitação | 4                           | 4                                      |
| Modo de edição            | Ativado (até 5 imagens de referência) | Ativado (até 5 imagens de referência) |
| Substituições de tamanho  | Compatíveis, incluindo tamanhos 2K/4K | Compatíveis, incluindo tamanhos 2K/4K |
| Proporção / resolução     | Não encaminhada à API de imagens da OpenAI | Mapeada para um tamanho compatível quando seguro |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consulte [Geração de imagens](/pt-BR/tools/image-generation) para conhecer os parâmetros compartilhados da ferramenta,
a seleção de provedor e o comportamento de failover.
</Note>

`gpt-image-2` é o padrão para geração de texto para imagem e edição de imagens
da OpenAI. `gpt-image-1.5`, `gpt-image-1` e `gpt-image-1-mini` permanecem utilizáveis
como substituições explícitas de modelo. Use `openai/gpt-image-1.5` para
saída PNG/WebP com fundo transparente; a API `gpt-image-2` atual rejeita
`background: "transparent"`.

Para uma solicitação de fundo transparente, chame `image_generate` com
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"` e
`background: "transparent"`; a opção mais antiga do provedor `openai.background` ainda é
aceita. O OpenClaw também protege as rotas públicas da OpenAI e do OAuth do OpenAI Codex
reescrevendo solicitações transparentes padrão de `openai/gpt-image-2` como
`gpt-image-1.5`; o Azure e endpoints personalizados compatíveis com a OpenAI mantêm os
nomes de implantação/modelo configurados.

A mesma configuração é exposta para execuções da CLI sem interface:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Um adesivo simples de círculo vermelho sobre um fundo transparente" \
  --json
```

Use as mesmas flags `--output-format` e `--background` com
`openclaw infer image edit` ao começar com um arquivo de entrada.
`--openai-background` permanece disponível como um alias específico da OpenAI. Use
`--quality low|medium|high|auto` para controlar a qualidade e o custo das imagens da OpenAI.
Use `--openai-moderation low|auto` para passar a indicação de moderação da OpenAI a partir de
`image generate` ou `image edit`.

Para instalações com OAuth do ChatGPT/Codex, mantenha a mesma referência `openai/gpt-image-2`. Quando
um perfil OAuth `openai` estiver configurado, o OpenClaw resolve esse token de acesso
OAuth armazenado e envia solicitações de imagem por meio do backend Responses do Codex; ele
não tenta primeiro `OPENAI_API_KEY` nem faz fallback silencioso para uma chave de API.
Configure `models.providers.openai` explicitamente com uma chave de API, URL-base
personalizada ou endpoint do Azure quando quiser usar a rota direta da API de imagens
da OpenAI. Se esse endpoint de imagens personalizado estiver em um endereço confiável
de LAN/privado, defina também `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; o OpenClaw
mantém endpoints de imagem privados/internos compatíveis com a OpenAI bloqueados, a menos que essa
ativação explícita esteja presente.

Gerar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Um pôster de lançamento refinado do OpenClaw no macOS" size=3840x2160 count=1
```

Gerar um PNG transparente:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Um adesivo simples de círculo vermelho sobre um fundo transparente" outputFormat=png background=transparent
```

Editar:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve o formato do objeto e altere o material para vidro translúcido" image=/path/to/reference.png size=1024x1536
```

## Geração de vídeos

O plugin integrado `openai` registra a geração de vídeos por meio da
ferramenta `video_generate`.

| Capacidade         | Valor                                                                              |
| ---------------- | ---------------------------------------------------------------------------------- |
| Modelo padrão     | `openai/sora-2`                                                                    |
| Modos             | Texto para vídeo, imagem para vídeo, edição de um único vídeo                      |
| Entradas de referência | 1 imagem ou 1 vídeo                                                           |
| Substituições de tamanho | Compatíveis com texto para vídeo e imagem para vídeo                         |
| Proporção         | Convertida para o tamanho compatível mais próximo, não encaminhada sem alterações  |
| Outras substituições | `resolution`, `audio` e `watermark` não são compatíveis e são descartadas com um aviso da ferramenta |

As solicitações de imagem para vídeo da OpenAI usam `POST /v1/videos` com uma imagem
`input_reference`. Edições de um único vídeo usam `POST /v1/videos/edits` com o
vídeo enviado no campo `video`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para ver os parâmetros compartilhados da ferramenta,
a seleção de provedor e o comportamento de failover.

O provedor OpenAI declara `supportsSize`, mas não `supportsAspectRatio` nem
`supportsResolution`. A camada compartilhada de normalização do OpenClaw converte uma
`aspectRatio` solicitada na `size` da OpenAI correspondente mais próxima antes que a
solicitação chegue ao provedor; portanto, solicitações de proporção de tela geralmente ainda funcionam.
`resolution` não tem fallback de tamanho e é descartado, sendo apresentado ao chamador como
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## Contribuição de prompt do GPT-5

O OpenClaw adiciona uma contribuição compartilhada de prompt do GPT-5 para modelos da família GPT-5 no
provedor `openai` (incluindo referências legadas do Codex anteriores ao reparo que são normalizadas
para `openai/*`). Outros provedores que também oferecem IDs de modelos da família GPT-5, como
rotas do OpenRouter ou opencode, não recebem essa sobreposição; ela é condicionada ao
ID de provedor `openai`, e não apenas ao ID do modelo. Modelos GPT-4.x mais antigos nunca
a recebem.

O harness nativo do app-server do Codex não recebe o contrato de comportamento de persona e
disciplina de ferramentas nem a sobreposição de estilo de interação amigável por meio de
instruções do desenvolvedor; o Codex nativo mantém os comportamentos de base, de modelo e de
documentação do projeto controlados pelo Codex, e o OpenClaw desativa a personalidade integrada do Codex em
threads nativas para que os arquivos de personalidade do workspace do agente permaneçam autoritativos.
O OpenClaw fornece apenas contexto de runtime às threads nativas do Codex: entrega por
canal, ferramentas dinâmicas do OpenClaw, delegação ACP, contexto do workspace e
Skills do OpenClaw. O texto de orientação de Heartbeat dessa mesma contribuição é a
única exceção: turnos de Heartbeat do Codex nativo o recebem, injetado como
instruções de colaboração dedicadas, e não por meio do hook compartilhado de contribuição
de prompt.

A contribuição do GPT-5 adiciona um contrato de comportamento com tags para persistência de
persona, segurança de execução, disciplina de ferramentas, formato de saída, verificações de
conclusão e validação em prompts correspondentes montados pelo OpenClaw. O comportamento de
resposta específico do canal e de mensagens silenciosas permanece no prompt de sistema compartilhado do OpenClaw
e na política de entrega de saída. A camada de estilo de interação amigável é
separada e configurável.

| Valor                  | Efeito                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (padrão) | Ativa a camada de estilo de interação amigável |
| `"on"`                 | Alias de `"friendly"`                      |
| `"off"`                | Desativa somente a camada de estilo amigável       |

<Tabs>
  <Tab title="Configuração">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Os valores não diferenciam maiúsculas de minúsculas durante o runtime; portanto, `"Off"` e `"off"` desativam a
camada de estilo amigável.
</Tip>

<Note>
O `plugins.entries.openai.config.personality` legado ainda é lido como
fallback de compatibilidade quando a configuração compartilhada
`agents.defaults.promptOverlays.gpt5.personality` não está definida.
</Note>

## Voz e fala

<AccordionGroup>
  <Accordion title="Síntese de fala (TTS)">
    O plugin `openai` incluído registra a síntese de fala para a
    superfície `messages.tts`.

    | Configuração      | Caminho da configuração                                            | Padrão                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Modelo        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Voz        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Velocidade        | `messages.tts.providers.openai.speed`                  | (não definido)                          |
    | Instruções | `messages.tts.providers.openai.instructions`           | (não definido, somente `gpt-4o-mini-tts`)  |
    | Formato       | `messages.tts.providers.openai.responseFormat`         | `opus` para mensagens de voz, `mp3` para arquivos |
    | Chave de API      | `messages.tts.providers.openai.apiKey`                 | Usa `OPENAI_API_KEY` como fallback   |
    | URL base     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Corpo adicional   | `messages.tts.providers.openai.extraBody` / `extra_body` | (não definido)                        |

    Modelos disponíveis: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Vozes disponíveis:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` é mesclado ao JSON da solicitação `/audio/speech` após os
    campos gerados pelo OpenClaw; portanto, use-o para endpoints compatíveis com a OpenAI que exigem
    chaves adicionais, como `lang`. Chaves de protótipo são ignoradas.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Defina `OPENAI_TTS_BASE_URL` para substituir a URL base do TTS sem afetar
    o endpoint da API de chat. Tanto o TTS quanto a voz Realtime da OpenAI são configurados
    por meio de uma chave de API da OpenAI Platform; instalações que usam somente OAuth ainda podem utilizar
    modelos de chat baseados no Codex, mas não a conversação ao vivo da OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Conversão de fala em texto">
    O plugin `openai` incluído registra a conversão de fala em texto em lote por meio da
    superfície de transcrição de compreensão de mídia do OpenClaw.

    - Modelo padrão: `gpt-4o-transcribe`
    - Endpoint: REST da OpenAI `/v1/audio/transcriptions`
    - Caminho de entrada: upload de arquivo de áudio multipart
    - Usado sempre que a transcrição de áudio de entrada lê `tools.media.audio`,
      incluindo segmentos de canais de voz do Discord e anexos de áudio dos canais

    Para forçar o uso da OpenAI na transcrição de áudio de entrada:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    As dicas de idioma e de prompt são encaminhadas à OpenAI quando fornecidas pela
    configuração compartilhada de mídia de áudio ou pela solicitação de transcrição por chamada.

  </Accordion>

  <Accordion title="Transcrição em tempo real">
    O plugin `openai` incluído registra a transcrição em tempo real para o
    plugin Voice Call.

    | Configuração          | Caminho da configuração                                                          | Padrão |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Modelo            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Idioma         | `...openai.language`                                                 | (não definido) |
    | Prompt           | `...openai.prompt`                                                   | (não definido) |
    | Duração do silêncio | `...openai.silenceDurationMs`                                        | `800`   |
    | Limite do VAD    | `...openai.vadThreshold`                                             | `0.5`   |
    | Autenticação             | `...openai.apiKey`, `OPENAI_API_KEY` ou perfil de chave de API `openai`    | Chave de API da plataforma obrigatória |

    <Note>
    Usa uma conexão WebSocket com `wss://api.openai.com/v1/realtime` e
    áudio G.711 u-law (`g711_ulaw` / `audio/pcmu`). Para um perfil de chave de API
    `openai`, o Gateway gera um segredo efêmero do cliente de transcrição
    Realtime antes de abrir o WebSocket. Esse provedor de streaming destina-se ao caminho de
    transcrição em tempo real do Voice Call; atualmente, a voz do Discord grava segmentos curtos
    e usa o caminho de transcrição em lote `tools.media.audio`
    em vez disso.
    </Note>

  </Accordion>

  <Accordion title="Voz em tempo real">
    O plugin `openai` incluído registra voz em tempo real para o plugin Voice Call.

    | Configuração                               | Caminho da configuração                                                              | Padrão             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Modelo                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Voz                                  | `...openai.voice`                                                       | `alloy`             |
    | Temperatura (ponte de implantação do Azure)  | `...openai.temperature`                                                 | `0.8`               |
    | Limite do VAD                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Duração do silêncio                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Preenchimento do prefixo                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Esforço de raciocínio                       | `...openai.reasoningEffort`                                             | (não definido)              |
    | Autenticação                                   | perfil de chave de API `openai`, `...openai.apiKey` ou `OPENAI_API_KEY` | Chave de API da OpenAI Platform obrigatória |

    Vozes Realtime integradas disponíveis para `gpt-realtime-2.1`: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    A OpenAI recomenda `marin` e `cedar` para obter a melhor qualidade Realtime. Esse
    é um conjunto distinto das vozes de conversão de texto em fala acima; uma voz exclusiva de TTS,
    como `fable`, `nova` ou `onyx`, não é válida para sessões Realtime.
    Defina explicitamente o modelo como `gpt-realtime-2.1-mini` quando preferir a
    variante Realtime 2.1 menor e de custo mais baixo.

    <Note>
    **GPT-Live (em breve).** Os modelos full-duplex `gpt-live-1` e
    `gpt-live-1-mini` da OpenAI substituíram o modo de voz do ChatGPT em julho de 2026; a
    API para desenvolvedores está sendo disponibilizada para organizações com acesso antecipado. O OpenClaw
    reconhece a família de modelos, mas ainda não a executa: as sessões GPT-Live usam
    somente WebRTC, controlam a própria alternância de turnos (sem VAD) e delegam o trabalho do agente
    por meio de um protocolo de eventos de transferência que os transportes em tempo real do OpenClaw ainda
    não implementam. A configuração de um modelo `gpt-live-*` falha de modo fechado, com
    orientações sobre a ponte WebSocket e as sessões Talk no navegador, em vez de
    conectar silenciosamente o áudio sem acesso ao agente. O acesso à API também é restrito
    por organização da OpenAI durante o acesso antecipado. Mantenha `gpt-realtime-2.1` (o
    padrão) até que o suporte ao GPT-Live seja disponibilizado.
    </Note>

    <Note>
    As pontes de backend em tempo real da OpenAI usam o formato de sessão WebSocket Realtime
    GA, que não aceita `session.temperature`. As implantações do Azure OpenAI
    continuam disponíveis por meio de `azureEndpoint` e `azureDeployment` e
    mantêm o formato de sessão compatível com a implantação (incluindo `temperature`).
    Compatível com chamadas bidirecionais de ferramentas e áudio G.711 u-law.
    </Note>

    <Note>
    A voz em tempo real é selecionada quando a sessão é criada. A OpenAI permite que a maioria dos
    campos da sessão seja alterada posteriormente, mas a voz não pode ser alterada depois que o
    modelo tiver emitido áudio nessa sessão. Atualmente, o OpenClaw expõe os
    IDs das vozes integradas de tempo real como strings.
    </Note>

    <Note>
    O Talk da Control UI usa sessões em tempo real da OpenAI no navegador com um segredo de cliente
    efêmero emitido pelo Gateway e uma troca direta de SDP do WebRTC pelo navegador
    com a API Realtime da OpenAI. O Gateway emite esse segredo de cliente com
    a credencial `openai` selecionada. Chaves configuradas, perfis de chave de API e
    `OPENAI_API_KEY` têm precedência; um perfil OAuth `openai` ou login externo
    do Codex é a alternativa. As pontes WebSocket em tempo real do relay do Gateway e do backend
    de Voice Call usam a mesma ordem de credenciais para endpoints nativos da OpenAI.
    A verificação ao vivo para mantenedores está disponível com
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`;
    as etapas da OpenAI verificam tanto a ponte WebSocket do backend quanto a troca de SDP
    do WebRTC pelo navegador sem registrar segredos.
    Passe `--openai-only` para executar essas duas etapas sem credenciais do Google.
    </Note>

  </Accordion>
</AccordionGroup>

## Endpoints do Azure OpenAI

O provedor `openai` incluído pode direcionar a geração de imagens para um recurso
do Azure OpenAI substituindo a URL base. No caminho de geração de imagens, o OpenClaw
detecta nomes de host do Azure em `models.providers.openai.baseUrl` e muda automaticamente para
o formato de solicitação do Azure.

<Note>
A voz em tempo real usa um caminho de configuração separado
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
e não é afetada por `models.providers.openai.baseUrl`. Consulte o acordeão **Voz em
tempo real** em [Voz e fala](#voice-and-speech) para ver suas configurações do Azure.
</Note>

Use o Azure OpenAI quando:

- Você já tiver uma assinatura, cota ou contrato empresarial
  do Azure OpenAI
- Você precisar dos controles de residência regional de dados ou conformidade fornecidos pelo Azure
- Você quiser manter o tráfego dentro de uma locação existente do Azure

### Configuração

Para gerar imagens no Azure por meio do provedor `openai` incluído, direcione
`models.providers.openai.baseUrl` para seu recurso do Azure e defina `apiKey` como
a chave do Azure OpenAI (não uma chave da OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

O OpenClaw reconhece estes sufixos de host do Azure para a rota de geração
de imagens do Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Para solicitações de geração de imagens em um host do Azure reconhecido, o OpenClaw:

- Envia o cabeçalho `api-key` em vez de `Authorization: Bearer`
- Usa caminhos específicos da implantação (`/openai/deployments/{deployment}/...`)
- Acrescenta `?api-version=...` a cada solicitação
- Usa um tempo limite padrão de solicitação de 600s para chamadas de geração de imagens do Azure.
  Os valores de `timeoutMs` por chamada ainda substituem esse padrão.

Outras URLs base (OpenAI pública, proxies compatíveis com OpenAI) mantêm o formato
padrão de solicitação de imagens da OpenAI.

<Note>
O roteamento do Azure para o caminho de geração de imagens do provedor `openai` exige
o OpenClaw 2026.4.22 ou posterior. Versões anteriores tratam qualquer
`openai.baseUrl` personalizado como o endpoint público da OpenAI e falham com implantações
de imagens do Azure.
</Note>

### Versão da API

Defina `AZURE_OPENAI_API_VERSION` para fixar uma versão específica de prévia ou GA do Azure
para o caminho de geração de imagens do Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

O padrão é `2024-12-01-preview` quando a variável não está definida.

### Os nomes dos modelos são nomes de implantação

O Azure OpenAI associa modelos a implantações. Para solicitações de geração de imagens
do Azure roteadas pelo provedor `openai` incluído, o campo `model` no OpenClaw
deve ser o **nome da implantação do Azure** configurado no portal do Azure, não
o ID público do modelo da OpenAI.

Se você criar uma implantação chamada `gpt-image-2-prod` que disponibiliza `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Um pôster limpo" size=1024x1024 count=1
```

A mesma regra de nome de implantação se aplica a qualquer chamada de geração de imagens roteada
pelo provedor `openai` incluído.

### Disponibilidade regional

Atualmente, a geração de imagens do Azure está disponível apenas em um subconjunto de regiões
(por exemplo, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consulte a lista atual de regiões da Microsoft antes de criar uma
implantação e confirme se o modelo específico é oferecido em sua região.

### Diferenças de parâmetros

O Azure OpenAI e a OpenAI pública nem sempre aceitam os mesmos parâmetros de imagem.
O Azure pode rejeitar opções permitidas pela OpenAI pública (por exemplo, determinados
valores de `background` em `gpt-image-2`) ou disponibilizá-las apenas em versões específicas
do modelo. Essas diferenças são provenientes do Azure e do modelo subjacente, não
do OpenClaw. Se uma solicitação do Azure falhar com um erro de validação, consulte no
portal do Azure o conjunto de parâmetros compatível com sua implantação e versão da API
específicas.

<Note>
O Azure OpenAI usa transporte nativo e comportamento de compatibilidade, mas não recebe
os cabeçalhos ocultos de atribuição do OpenClaw — consulte o acordeão **Rotas nativas versus
compatíveis com OpenAI** em [Configuração avançada](#advanced-configuration).

Para tráfego de chat ou Responses no Azure (além da geração de imagens), use o
fluxo de integração ou uma configuração dedicada do provedor Azure; `openai.baseUrl` por si só
não adota o formato de API/autenticação do Azure. Existe um provedor
`azure-openai-responses/*` separado; consulte o acordeão Compaction no lado do servidor
abaixo.
</Note>

## Configuração avançada

Os exemplos de `params` por modelo abaixo definem o formato da solicitação do provedor
incorporado do OpenClaw. Configurá-los constitui um comportamento de solicitação definido pelo autor,
portanto, uma rota `auto` que seria elegível permanece no OpenClaw, em vez de selecionar
implicitamente o Codex. O harness nativo do servidor de aplicativo Codex controla seu próprio
transporte e suas configurações de solicitação; `agentRuntime.id: "codex"` explícito falha de forma fechada
quando a rota efetiva não está declarada como compatível com Codex.

<AccordionGroup>
  <Accordion title="Transporte (WebSocket versus SSE)">
    O OpenClaw usa WebSocket primeiro, com SSE como alternativa (`"auto"`) para `openai/*`.

    No modo `"auto"`, o OpenClaw:
    - Tenta novamente após uma falha inicial do WebSocket antes de recorrer ao SSE
    - Após uma falha, marca o WebSocket como degradado por 60 segundos e usa SSE
      durante o período de espera
    - Anexa cabeçalhos estáveis de identidade da sessão e do turno para novas tentativas e
      reconexões
    - Normaliza contadores de uso (`input_tokens` / `prompt_tokens`) entre
      variantes de transporte

    | Valor                | Comportamento                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (padrão)   | WebSocket primeiro, SSE como alternativa     |
    | `"sse"`              | Forçar somente SSE                    |
    | `"websocket"`        | Forçar somente WebSocket              |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentação relacionada da OpenAI:
    - [API Realtime com WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Respostas de API por streaming (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Modo rápido">
    O OpenClaw disponibiliza uma alternância compartilhada de modo rápido para `openai/*`:

    - **Chat/UI:** `/fast status|auto|on|off`
    - **Configuração:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Quando ativado, o OpenClaw mapeia o modo rápido para o processamento prioritário da OpenAI
    (`service_tier = "priority"`). Os valores existentes de `service_tier` são
    preservados, e o modo rápido não reescreve `reasoning` nem
    `text.verbosity`. `fastMode: "auto"` inicia novas chamadas de modelo no modo rápido até o
    limite automático e, depois, inicia chamadas posteriores de nova tentativa, alternativa, resultado
    de ferramenta ou continuação sem o modo rápido. O limite padrão é 60 segundos;
    defina `params.fastAutoOnSeconds` no modelo ativo para alterá-lo.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    As substituições da sessão têm precedência sobre a configuração. Limpar a substituição da sessão na
    UI Sessions restaura a sessão ao padrão configurado.
    </Note>

  </Accordion>

  <Accordion title="Processamento prioritário (service_tier)">
    A API da OpenAI disponibiliza processamento prioritário por meio de `service_tier`. Defina-o por
    modelo no OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valores compatíveis: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` é encaminhado apenas para endpoints nativos da OpenAI
    (`api.openai.com`) e endpoints nativos do Codex (`chatgpt.com/backend-api`).
    Se qualquer um dos provedores for roteado por um proxy, o OpenClaw mantém
    `service_tier` inalterado.
    </Warning>

  </Accordion>

  <Accordion title="Compaction no lado do servidor (API Responses)">
    Para modelos Responses diretos da OpenAI (`openai/*` em `api.openai.com`), o
    wrapper de stream do OpenClaw do Plugin da OpenAI ativa automaticamente a Compaction
    no lado do servidor:

    - Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
    - Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Valor padrão de `compact_threshold`: 70% de `contextWindow` (ou `80000` quando
      indisponível)

    Isso se aplica ao caminho de runtime integrado do OpenClaw e aos hooks do provedor
    OpenAI usados por execuções incorporadas. O harness nativo do servidor de aplicativo Codex gerencia
    seu próprio contexto por meio do Codex e não é afetado por essa configuração.

    <Tabs>
      <Tab title="Ativar explicitamente">
        Útil para endpoints compatíveis, como o Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Limite personalizado">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Desativar">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` controla apenas a injeção de `context_management`.
    Os modelos Responses diretos da OpenAI ainda forçam `store: true`, a menos que a compatibilidade
    defina `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Modo GPT estritamente agêntico">
    Para modelos da família GPT-5 do provedor `openai` executados pelo runtime incorporado
    do OpenClaw, o OpenClaw já usa por padrão um contrato de execução mais estrito chamado
    `strict-agentic`. Ele é ativado automaticamente sempre que o provedor resolvido é
    `openai` e o ID do modelo corresponde à família GPT-5, a menos que a configuração
    desative-o explicitamente:

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Definir `"strict-agentic"` explicitamente não produz efeito em uma rota compatível (ele
    já é o padrão) e fica inerte em pares de provedor/modelo incompatíveis.

    Com `strict-agentic` ativo, o OpenClaw:
    - Ativa automaticamente `update_plan` para trabalhos substanciais
    - Tenta novamente turnos estruturalmente vazios ou somente com raciocínio com uma continuação
      de resposta visível
    - Usa eventos explícitos de plano do harness quando o harness selecionado os
      fornece

    O OpenClaw não classifica o texto do assistente para decidir se um turno é um
    plano, uma atualização de progresso ou uma resposta final.

    <Note>
    Esse contrato reside inteiramente no executor de agente incorporado do OpenClaw. Ele
    não se aplica ao harness nativo do app-server do Codex, que gerencia seu próprio
    comportamento de turnos e planos; a seleção do harness é mais importante do que a
    configuração do contrato de execução para execuções nativas do Codex.
    </Note>

  </Accordion>

  <Accordion title="Rotas nativas versus compatíveis com OpenAI">
    O OpenClaw trata endpoints diretos da OpenAI, do Codex e do Azure OpenAI
    de forma diferente dos proxies `/v1` genéricos compatíveis com OpenAI:

    **Rotas nativas** (`openai/*`, Azure OpenAI):
    - Mantêm `reasoning: { effort: "none" }` somente para modelos compatíveis com o
      esforço `none` da OpenAI
    - Omitem o raciocínio desativado para modelos ou proxies que rejeitam
      `reasoning.effort: "none"`
    - Usam por padrão o modo estrito nos esquemas de ferramentas
    - Anexam cabeçalhos ocultos de atribuição somente em hosts nativos verificados (o Azure
      OpenAI não recebe esses cabeçalhos, embora seja uma rota nativa)
    - Mantêm a formatação de solicitações exclusiva da OpenAI (`service_tier`, `store`,
      compatibilidade de raciocínio, dicas de cache de prompt)

    **Rotas proxy/compatíveis:**
    - Usam um comportamento de compatibilidade mais flexível
    - Removem `store` de Completions de payloads `openai-completions` não nativos
    - Aceitam JSON avançado de passagem direta `params.extra_body`/`params.extraBody`
      para proxies de Completions compatíveis com OpenAI
    - Aceitam `params.chat_template_kwargs` para proxies de Completions compatíveis com OpenAI,
      como o vLLM
    - Não impõem esquemas estritos de ferramentas nem cabeçalhos exclusivos de rotas nativas

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagens e seleção de provedores.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeos e seleção de provedores.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
</CardGroup>

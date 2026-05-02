---
read_when:
    - Adição ou modificação da CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Alterando o comportamento de fallback do modelo ou a UX de seleção
    - Atualizando sondas de varredura de modelos (ferramentas/imagens)
sidebarTitle: Models CLI
summary: 'CLI de modelos: listar, definir, apelidos, alternativas, varredura, status'
title: CLI de modelos
x-i18n:
    generated_at: "2026-05-02T05:45:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 620df60ee1117a32f0232bf4b56fbc5a9558be5cc3b73a31336f8ab64fd29ebb
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Failover de modelos" href="/pt-BR/concepts/model-failover">
    Rotação de perfis de autenticação, cooldowns e como isso interage com fallbacks.
  </Card>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers">
    Visão geral rápida dos provedores e exemplos.
  </Card>
  <Card title="Runtimes de agentes" href="/pt-BR/concepts/agent-runtimes">
    Pi, Codex e outros runtimes de loop de agente.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults">
    Chaves de configuração de modelo.
  </Card>
</CardGroup>

Refs de modelo escolhem um provedor e um modelo. Elas normalmente não escolhem o runtime de agente de baixo nível. Por exemplo, `openai/gpt-5.5` pode ser executado pelo caminho normal do provedor OpenAI ou pelo runtime de servidor de aplicativo do Codex, dependendo de `agents.defaults.agentRuntime.id`. No modo de runtime do Codex, a ref `openai/gpt-*` não implica cobrança por chave de API; a autenticação pode vir de uma conta Codex ou do perfil de autenticação `openai-codex`. Consulte [Runtimes de agentes](/pt-BR/concepts/agent-runtimes).

## Como a seleção de modelo funciona

OpenClaw seleciona modelos nesta ordem:

<Steps>
  <Step title="Modelo primário">
    `agents.defaults.model.primary` (ou `agents.defaults.model`).
  </Step>
  <Step title="Fallbacks">
    `agents.defaults.model.fallbacks` (na ordem).
  </Step>
  <Step title="Failover de autenticação do provedor">
    O failover de autenticação acontece dentro de um provedor antes de passar para o próximo modelo.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Superfícies de modelo relacionadas">
    - `agents.defaults.models` é a lista de permissões/catálogo de modelos que o OpenClaw pode usar (mais aliases).
    - `agents.defaults.imageModel` é usado **somente quando** o modelo primário não consegue aceitar imagens.
    - `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se omitido, a ferramenta recorre a `agents.defaults.imageModel` e depois ao modelo resolvido da sessão/padrão.
    - `agents.defaults.imageGenerationModel` é usado pelo recurso compartilhado de geração de imagens. Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de imagens em ordem de ID de provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
    - `agents.defaults.musicGenerationModel` é usado pelo recurso compartilhado de geração de música. Se omitido, `music_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de música em ordem de ID de provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
    - `agents.defaults.videoGenerationModel` é usado pelo recurso compartilhado de geração de vídeo. Se omitido, `video_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual e depois os demais provedores registrados de geração de vídeo em ordem de ID de provedor. Se você definir um provedor/modelo específico, configure também a autenticação/chave de API desse provedor.
    - Padrões por agente podem substituir `agents.defaults.model` via `agents.list[].model` mais associações (consulte [Roteamento multiagente](/pt-BR/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Origem da seleção e comportamento de fallback

O mesmo `provider/model` pode significar coisas diferentes dependendo de onde veio:

- Padrões configurados (`agents.defaults.model.primary` e primários específicos de agente) são o ponto de partida normal e usam `agents.defaults.model.fallbacks`.
- Seleções automáticas de fallback são um estado temporário de recuperação. Elas são armazenadas com `modelOverrideSource: "auto"` para que turnos posteriores possam continuar usando a cadeia de fallback sem testar primeiro um primário sabidamente ruim.
- Seleções de sessão do usuário são exatas. `/model`, o seletor de modelo, `session_status(model=...)` e `sessions.patch` armazenam `modelOverrideSource: "user"`; se esse provedor/modelo selecionado estiver inacessível, o OpenClaw falha de forma visível em vez de passar para outro modelo configurado.
- Cron `--model` / payload `model` é um primário por tarefa. Ele ainda usa fallbacks configurados, a menos que a tarefa forneça `fallbacks` explícitos no payload (use `fallbacks: []` para uma execução cron estrita).
- Os seletores de modelo padrão e lista de permissões da CLI respeitam `models.mode: "replace"` listando `models.providers.*.models` explícitos em vez de carregar o catálogo integrado completo.
- O seletor de modelo da UI de controle pede ao Gateway sua visualização de modelos configurada: `agents.defaults.models` quando presente; caso contrário, `models.providers.*.models` explícitos mais provedores com autenticação utilizável. O catálogo integrado completo fica reservado para visualizações explícitas de navegação, como `models.list` com `view: "all"` ou `openclaw models list --all`.

## Política rápida de modelos

- Defina seu primário como o modelo de geração mais recente e mais forte disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e chat de menor risco.
- Para agentes com ferramentas habilitadas ou entradas não confiáveis, evite níveis de modelo mais antigos/fracos.

## Onboarding (recomendado)

Se você não quiser editar a configuração manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar modelo + autenticação para provedores comuns, incluindo **assinatura OpenAI Code (Codex)** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de configuração (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (lista de permissões + aliases + parâmetros de provedor)
- `models.providers` (provedores personalizados gravados em `models.json`)

<Note>
Refs de modelo são normalizadas para minúsculas. Aliases de provedor como `z.ai/*` são normalizados para `zai/*`.

Exemplos de configuração de provedor (incluindo OpenCode) ficam em [OpenCode](/pt-BR/providers/opencode).
</Note>

### Edições seguras da lista de permissões

Use gravações aditivas ao atualizar `agents.defaults.models` manualmente:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Regras de proteção contra sobrescrita">
    `openclaw config set` protege mapas de modelo/provedor contra sobrescritas acidentais. Uma atribuição simples de objeto a `agents.defaults.models`, `models.providers` ou `models.providers.<id>.models` é rejeitada quando removeria entradas existentes. Use `--merge` para alterações aditivas; use `--replace` somente quando o valor fornecido deve se tornar o valor de destino completo.

    A configuração interativa de provedor e `openclaw configure --section model` também mesclam seleções no escopo do provedor à lista de permissões existente, então adicionar Codex, Ollama ou outro provedor não remove entradas de modelo não relacionadas. Configure preserva um `agents.defaults.model.primary` existente quando a autenticação do provedor é reaplicada. Comandos explícitos de definição de padrão, como `openclaw models auth login --provider <id> --set-default` e `openclaw models set <model>`, ainda substituem `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "O modelo não é permitido" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **lista de permissões** para `/model` e para substituições de sessão. Quando um usuário seleciona um modelo que não está nessa lista de permissões, o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode dar a impressão de que ele "não respondeu". A correção é:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a lista de permissões (remover `agents.defaults.models`), ou
- Escolher um modelo em `/model list`.

</Warning>

Para modelos locais/GGUF, armazene a ref completa com prefixo do provedor na lista de permissões,
por exemplo `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` ou o
`provider/model` exato mostrado por `openclaw models list --provider <provider>`.
Nomes de arquivos locais sem prefixo ou nomes de exibição não são suficientes quando a lista de permissões está
ativa.

Exemplo de configuração de lista de permissões:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Troca de modelos no chat (`/model`)

Você pode trocar modelos para a sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Comportamento do seletor">
    - `/model` (e `/model list`) é um seletor compacto e numerado (família de modelo + provedores disponíveis).
    - No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo, além de uma etapa de envio.
    - `/models add` está obsoleto e agora retorna uma mensagem de obsolescência em vez de registrar modelos pelo chat.
    - `/model <#>` seleciona a partir desse seletor.

  </Accordion>
  <Accordion title="Persistência e troca em tempo real">
    - `/model` persiste a nova seleção da sessão imediatamente.
    - Se o agente estiver ocioso, a próxima execução usa o novo modelo imediatamente.
    - Se uma execução já estiver ativa, o OpenClaw marca uma troca em tempo real como pendente e só reinicia no novo modelo em um ponto limpo de nova tentativa.
    - Se a atividade de ferramentas ou a saída de resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de nova tentativa ou o próximo turno do usuário.
    - Uma ref `/model` selecionada pelo usuário é estrita para essa sessão: se o provedor/modelo selecionado estiver inacessível, a resposta falha de forma visível em vez de responder silenciosamente a partir de `agents.defaults.model.fallbacks`. Isso é diferente dos padrões configurados e dos primários de tarefas cron, que ainda podem usar cadeias de fallback.
    - `/model status` é a visualização detalhada (candidatos de autenticação e, quando configurado, endpoint de provedor `baseUrl` + modo `api`).

  </Accordion>
  <Accordion title="Análise de refs">
    - Refs de modelo são analisadas dividindo no **primeiro** `/`. Use `provider/model` ao digitar `/model <ref>`.
    - Se o próprio ID do modelo contém `/` (estilo OpenRouter), você deve incluir o prefixo do provedor (exemplo: `/model openrouter/moonshotai/kimi-k2`).
    - Se você omitir o provedor, o OpenClaw resolve a entrada nesta ordem:
      1. correspondência de alias
      2. correspondência única de provedor configurado para esse ID de modelo exato sem prefixo
      3. fallback obsoleto para o provedor padrão configurado — se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw recorre ao primeiro provedor/modelo configurado para evitar expor um padrão obsoleto de provedor removido.
  </Accordion>
</AccordionGroup>

Comportamento/configuração completos do comando: [Comandos de barra](/pt-BR/tools/slash-commands).

## Comandos da CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (sem subcomando) é um atalho para `models status`.

### `models list`

Mostra modelos configurados/disponíveis por autenticação por padrão. Flags úteis:

<ParamField path="--all" type="boolean">
  Catálogo completo. Inclui linhas estáticas de catálogo agrupadas de provedores bundled antes da configuração da autenticação, para que visualizações somente de descoberta possam mostrar modelos que ficam indisponíveis até você adicionar credenciais correspondentes do provedor.
</ParamField>
<ParamField path="--local" type="boolean">
  Apenas provedores locais.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtra por id do provedor, por exemplo `moonshot`. Rótulos de exibição de seletores interativos não são aceitos.
</ParamField>
<ParamField path="--plain" type="boolean">
  Um modelo por linha.
</ParamField>
<ParamField path="--json" type="boolean">
  Saída legível por máquina.
</ParamField>

### `models status`

Mostra o modelo primário resolvido, fallbacks, modelo de imagem e uma visão geral de autenticação dos provedores configurados. Também exibe o status de expiração do OAuth para perfis encontrados no armazenamento de autenticação (avisa dentro de 24h por padrão). `--plain` imprime apenas o modelo primário resolvido.

<AccordionGroup>
  <Accordion title="Comportamento de autenticação e sondagem">
    - O status do OAuth é sempre mostrado (e incluído na saída `--json`). Se um provedor configurado não tiver credenciais, `models status` imprime uma seção **Autenticação ausente**.
    - JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers` (autenticação efetiva por provedor, incluindo credenciais vindas do ambiente). `auth.oauth` é apenas a integridade do perfil no armazenamento de autenticação; provedores somente por ambiente não aparecem ali.
    - Use `--check` para automação (código de saída `1` quando ausente/expirado, `2` quando prestes a expirar).
    - Use `--probe` para verificações de autenticação ao vivo; linhas de sondagem podem vir de perfis de autenticação, credenciais de ambiente ou `models.json`.
    - Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem relata `excluded_by_auth_order` em vez de tentar usá-lo. Se a autenticação existir, mas nenhum modelo sondável puder ser resolvido para esse provedor, a sondagem relata `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
A escolha de autenticação depende do provedor/conta. Para hosts de Gateway sempre ativos, chaves de API geralmente são as mais previsíveis; a reutilização da Claude CLI e perfis existentes de OAuth/token da Anthropic também são compatíveis.
</Note>

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Escaneamento (modelos gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e, opcionalmente, pode sondar modelos quanto ao suporte a ferramentas e imagens.

<ParamField path="--no-probe" type="boolean">
  Ignora sondagens ao vivo (somente metadados).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Tamanho mínimo de parâmetros (bilhões).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Ignora modelos mais antigos.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtro por prefixo de provedor.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Tamanho da lista de fallback.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Define `agents.defaults.model.primary` como a primeira seleção.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Define `agents.defaults.imageModel.primary` como a primeira seleção de imagem.
</ParamField>

<Note>
O catálogo `/models` do OpenRouter é público, então escaneamentos somente de metadados podem listar candidatos gratuitos sem uma chave. Sondagem e inferência ainda exigem uma chave de API do OpenRouter (de perfis de autenticação ou `OPENROUTER_API_KEY`). Se nenhuma chave estiver disponível, `openclaw models scan` recorre à saída somente de metadados e deixa a configuração inalterada. Use `--no-probe` para solicitar explicitamente o modo somente metadados.
</Note>

Os resultados do escaneamento são classificados por:

1. Suporte a imagens
2. Latência de ferramentas
3. Tamanho do contexto
4. Contagem de parâmetros

Entrada:

- Lista `/models` do OpenRouter (filtro `:free`)
- Sondagens ao vivo exigem chave de API do OpenRouter vinda de perfis de autenticação ou `OPENROUTER_API_KEY` (veja [Variáveis de ambiente](/pt-BR/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitação/sondagem: `--timeout`, `--concurrency`

Quando sondagens ao vivo rodam em um TTY, você pode selecionar fallbacks interativamente. No modo não interativo, passe `--yes` para aceitar os padrões. Resultados somente de metadados são informativos; `--set-default` e `--set-image` exigem sondagens ao vivo para que o OpenClaw não configure um modelo OpenRouter sem chave e inutilizável.

## Registro de modelos (`models.json`)

Provedores personalizados em `models.providers` são gravados em `models.json` no diretório do agente (padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo é mesclado por padrão, a menos que `models.mode` esteja definido como `replace`.

<AccordionGroup>
  <Accordion title="Precedência do modo de mesclagem">
    Precedência do modo de mesclagem para IDs de provedor correspondentes:

    - `baseUrl` não vazio já presente em `models.json` do agente vence.
    - `apiKey` não vazio em `models.json` do agente vence apenas quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
    - Valores de `apiKey` de provedores gerenciados por SecretRef são atualizados a partir de marcadores de origem (`ENV_VAR_NAME` para refs de ambiente, `secretref-managed` para refs de arquivo/exec) em vez de persistir segredos resolvidos.
    - Valores de cabeçalho de provedores gerenciados por SecretRef são atualizados a partir de marcadores de origem (`secretref-env:ENV_VAR_NAME` para refs de ambiente, `secretref-managed` para refs de arquivo/exec).
    - `apiKey`/`baseUrl` vazios ou ausentes do agente recorrem a `models.providers` da configuração.
    - Outros campos do provedor são atualizados a partir da configuração e dos dados de catálogo normalizados.

  </Accordion>
</AccordionGroup>

<Note>
A persistência de marcadores tem a origem como autoridade: o OpenClaw grava marcadores do snapshot de configuração de origem ativo (pré-resolução), não de valores secretos resolvidos em tempo de execução. Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos acionados por comando como `openclaw agent`.
</Note>

## Relacionado

- [Runtimes de agente](/pt-BR/concepts/agent-runtimes) — PI, Codex e outros runtimes de loop de agente
- [Referência de configuração](/pt-BR/gateway/config-agents#agent-defaults) — chaves de configuração de modelo
- [Geração de imagens](/pt-BR/tools/image-generation) — configuração de modelo de imagem
- [Failover de modelo](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Provedores de modelo](/pt-BR/concepts/model-providers) — roteamento e autenticação de provedores
- [Geração de música](/pt-BR/tools/music-generation) — configuração de modelo de música
- [Geração de vídeo](/pt-BR/tools/video-generation) — configuração de modelo de vídeo

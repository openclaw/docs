---
read_when:
    - Adicionando ou modificando a CLI de modelos (models list/set/scan/aliases/fallbacks)
    - Alterando o comportamento de fallback de modelo ou a UX de seleção
    - Atualizando sondas de varredura de modelo (ferramentas/imagens)
summary: 'CLI de modelos: listar, definir, aliases, fallbacks, varredura, status'
title: CLI de modelos
x-i18n:
    generated_at: "2026-04-25T13:44:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

Consulte [/concepts/model-failover](/pt-BR/concepts/model-failover) para rotação de
perfis de autenticação, períodos de espera e como isso interage com fallbacks.
Visão geral rápida de provedores + exemplos: [/concepts/model-providers](/pt-BR/concepts/model-providers).
Referências de modelo escolhem um provedor e um modelo. Elas normalmente não escolhem o
runtime de agente de baixo nível. Por exemplo, `openai/gpt-5.5` pode ser executado pelo
caminho normal do provedor OpenAI ou pelo runtime do servidor de aplicativo Codex, dependendo
de `agents.defaults.embeddedHarness.runtime`. Consulte
[/concepts/agent-runtimes](/pt-BR/concepts/agent-runtimes).

## Como a seleção de modelo funciona

O OpenClaw seleciona modelos nesta ordem:

1. Modelo **primário** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Fallbacks** em `agents.defaults.model.fallbacks` (na ordem).
3. **Failover** de autenticação do provedor acontece dentro de um provedor antes de passar para o
   próximo modelo.

Relacionado:

- `agents.defaults.models` é a allowlist/catálogo de modelos que o OpenClaw pode usar (além de aliases).
- `agents.defaults.imageModel` é usado **somente quando** o modelo primário não pode aceitar imagens.
- `agents.defaults.pdfModel` é usado pela ferramenta `pdf`. Se omitido, a ferramenta
  recorre a `agents.defaults.imageModel`, depois ao modelo padrão/de sessão resolvido.
- `agents.defaults.imageGenerationModel` é usado pela capacidade compartilhada de geração de imagens. Se omitido, `image_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual, depois os demais provedores de geração de imagem registrados na ordem de ID do provedor. Se você definir um provedor/modelo específico, também configure a autenticação/chave de API desse provedor.
- `agents.defaults.musicGenerationModel` é usado pela capacidade compartilhada de geração de música. Se omitido, `music_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual, depois os demais provedores de geração de música registrados na ordem de ID do provedor. Se você definir um provedor/modelo específico, também configure a autenticação/chave de API desse provedor.
- `agents.defaults.videoGenerationModel` é usado pela capacidade compartilhada de geração de vídeo. Se omitido, `video_generate` ainda pode inferir um padrão de provedor com autenticação. Ele tenta primeiro o provedor padrão atual, depois os demais provedores de geração de vídeo registrados na ordem de ID do provedor. Se você definir um provedor/modelo específico, também configure a autenticação/chave de API desse provedor.
- Padrões por agente podem substituir `agents.defaults.model` via `agents.list[].model` mais vínculos (consulte [/concepts/multi-agent](/pt-BR/concepts/multi-agent)).

## Política rápida de modelos

- Defina seu modelo primário como o modelo mais forte e de geração mais recente disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e chats de menor importância.
- Para agentes com ferramentas ativadas ou entradas não confiáveis, evite camadas de modelos mais antigas/mais fracas.

## Onboarding (recomendado)

Se você não quiser editar a configuração manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar modelo + autenticação para provedores comuns, incluindo **OpenAI Code (Codex)
subscription** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de configuração (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + parâmetros de provedor)
- `models.providers` (provedores personalizados gravados em `models.json`)

Referências de modelo são normalizadas para minúsculas. Aliases de provedor como `z.ai/*` são normalizados
para `zai/*`.

Exemplos de configuração de provedor (incluindo OpenCode) estão em
[/providers/opencode](/pt-BR/providers/opencode).

### Edições seguras da allowlist

Use gravações aditivas ao atualizar `agents.defaults.models` manualmente:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protege mapas de modelo/provedor contra sobrescrita acidental. Uma
atribuição simples de objeto a `agents.defaults.models`, `models.providers` ou
`models.providers.<id>.models` é rejeitada quando removeria entradas existentes.
Use `--merge` para mudanças aditivas; use `--replace` apenas quando o
valor fornecido deve se tornar o valor completo de destino.

A configuração interativa de provedor e `openclaw configure --section model` também mesclam
seleções com escopo de provedor à allowlist existente, então adicionar Codex,
Ollama ou outro provedor não remove entradas de modelo não relacionadas.
Configure preserva um `agents.defaults.model.primary` existente quando a autenticação do provedor
é reaplicada. Comandos explícitos de definição de padrão, como
`openclaw models auth login --provider <id> --set-default` e
`openclaw models set <model>`, ainda substituem `agents.defaults.model.primary`.

## "Model is not allowed" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e para
substituições de sessão. Quando um usuário seleciona um modelo que não está nessa allowlist,
o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode dar a impressão
de que “não respondeu”. A correção é:

- Adicionar o modelo a `agents.defaults.models`, ou
- Limpar a allowlist (remover `agents.defaults.models`), ou
- Escolher um modelo de `/model list`.

Exemplo de configuração de allowlist:

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

## Alternando modelos no chat (`/model`)

Você pode alternar modelos para a sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Observações:

- `/model` (e `/model list`) é um seletor compacto e numerado (família de modelos + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e modelo, além de uma etapa Enviar.
- `/models add` está obsoleto e agora retorna uma mensagem de descontinuação em vez de registrar modelos a partir do chat.
- `/model <#>` seleciona a partir desse seletor.
- `/model` persiste imediatamente a nova seleção da sessão.
- Se o agente estiver ocioso, a próxima execução usa o novo modelo imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia com o novo modelo em um ponto limpo de nova tentativa.
- Se a atividade de ferramenta ou a saída da resposta já tiver começado, a troca pendente pode permanecer na fila até uma oportunidade posterior de nova tentativa ou até o próximo turno do usuário.
- `/model status` é a visão detalhada (candidatos de autenticação e, quando configurado, `baseUrl` de endpoint do provedor + modo `api`).
- Referências de modelo são analisadas separando pelo **primeiro** `/`. Use `provider/model` ao digitar `/model <ref>`.
- Se o próprio ID do modelo contiver `/` (estilo OpenRouter), você deve incluir o prefixo do provedor (exemplo: `/model openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw resolve a entrada nesta ordem:
  1. correspondência de alias
  2. correspondência única de provedor configurado para esse ID de modelo exato sem prefixo
  3. fallback obsoleto para o provedor padrão configurado
     Se esse provedor não expuser mais o modelo padrão configurado, o OpenClaw
     em vez disso recorre ao primeiro provedor/modelo configurado para evitar
     expor um padrão obsoleto de provedor removido.

Comportamento/configuração completa do comando: [Slash commands](/pt-BR/tools/slash-commands).

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

Mostra modelos configurados por padrão. Sinalizadores úteis:

- `--all`: catálogo completo
- `--local`: apenas provedores locais
- `--provider <id>`: filtrar por ID do provedor, por exemplo `moonshot`; rótulos de exibição de seletores interativos não são aceitos
- `--plain`: um modelo por linha
- `--json`: saída legível por máquina

`--all` inclui linhas estáticas de catálogo pertencentes a provedores empacotados antes da
configuração da autenticação, então visualizações somente de descoberta podem mostrar modelos que ficam indisponíveis até você adicionar credenciais correspondentes do provedor.

### `models status`

Mostra o modelo primário resolvido, fallbacks, modelo de imagem e uma visão geral de autenticação
dos provedores configurados. Também exibe o status de expiração OAuth para perfis encontrados
no armazenamento de autenticação (avisa dentro de 24h por padrão). `--plain` imprime apenas o
modelo primário resolvido.
O status OAuth é sempre mostrado (e incluído na saída `--json`). Se um provedor configurado
não tiver credenciais, `models status` imprime uma seção **Missing auth**.
O JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers`
(autenticação efetiva por provedor, incluindo credenciais vindas de env). `auth.oauth`
é apenas a integridade de perfis do armazenamento de autenticação; provedores somente-env não aparecem ali.
Use `--check` para automação (saída `1` quando ausente/expirado, `2` quando expira).
Use `--probe` para verificações de autenticação ao vivo; linhas de sondagem podem vir de perfis de autenticação, credenciais de env
ou `models.json`.
Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem informa
`excluded_by_auth_order` em vez de tentá-lo. Se a autenticação existir, mas nenhum modelo passível de sondagem puder ser resolvido para esse provedor, a sondagem informa `status: no_model`.

A escolha de autenticação depende de provedor/conta. Para hosts de Gateway sempre ativos, chaves de API
geralmente são as mais previsíveis; reutilização do Claude CLI e perfis existentes de OAuth/token do Anthropic também são compatíveis.

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Varredura (modelos gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de modelos gratuitos** do OpenRouter e pode
opcionalmente sondar modelos quanto a suporte a ferramentas e imagens.

Sinalizadores principais:

- `--no-probe`: pula sondagens ao vivo (somente metadados)
- `--min-params <b>`: tamanho mínimo de parâmetros (bilhões)
- `--max-age-days <days>`: pular modelos mais antigos
- `--provider <name>`: filtro por prefixo de provedor
- `--max-candidates <n>`: tamanho da lista de fallbacks
- `--set-default`: define `agents.defaults.model.primary` para a primeira seleção
- `--set-image`: define `agents.defaults.imageModel.primary` para a primeira seleção de imagem

O catálogo `/models` do OpenRouter é público, então varreduras somente de metadados podem listar
candidatos gratuitos sem chave. Sondagem e inferência ainda exigem uma chave de API
do OpenRouter (de perfis de autenticação ou `OPENROUTER_API_KEY`). Se nenhuma chave estiver
disponível, `openclaw models scan` recorre à saída somente de metadados e deixa a
configuração inalterada. Use `--no-probe` para solicitar explicitamente o modo somente metadados.

Os resultados da varredura são classificados por:

1. Suporte a imagem
2. Latência de ferramentas
3. Tamanho de contexto
4. Contagem de parâmetros

Entrada

- Lista `/models` do OpenRouter (filtro `:free`)
- Sondagens ao vivo exigem chave de API do OpenRouter de perfis de autenticação ou `OPENROUTER_API_KEY` (consulte [/environment](/pt-BR/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de solicitação/sondagem: `--timeout`, `--concurrency`

Quando sondagens ao vivo são executadas em um TTY, você pode selecionar fallbacks interativamente. Em
modo não interativo, passe `--yes` para aceitar os padrões. Resultados somente de metadados são
informativos; `--set-default` e `--set-image` exigem sondagens ao vivo para que o
OpenClaw não configure um modelo OpenRouter inutilizável sem chave.

## Registro de modelos (`models.json`)

Provedores personalizados em `models.providers` são gravados em `models.json` sob o
diretório do agente (padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo
é mesclado por padrão, a menos que `models.mode` seja definido como `replace`.

Precedência do modo de mesclagem para IDs de provedor correspondentes:

- `baseUrl` não vazio já presente no `models.json` do agente prevalece.
- `apiKey` não vazio no `models.json` do agente prevalece somente quando esse provedor não é gerenciado por SecretRef no contexto atual de configuração/perfil de autenticação.
- Valores de `apiKey` de provedor gerenciados por SecretRef são atualizados a partir de marcadores da origem (`ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec) em vez de persistir segredos resolvidos.
- Valores de cabeçalho de provedor gerenciados por SecretRef são atualizados a partir de marcadores da origem (`secretref-env:ENV_VAR_NAME` para refs de env, `secretref-managed` para refs de file/exec).
- `apiKey`/`baseUrl` do agente vazios ou ausentes recorrem a `models.providers` da configuração.
- Outros campos do provedor são atualizados a partir da configuração e de dados normalizados do catálogo.

A persistência de marcadores é autoritativa pela origem: o OpenClaw grava marcadores a partir do snapshot ativo da configuração de origem (pré-resolução), não a partir de valores secretos resolvidos em tempo de execução.
Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos acionados por comando como `openclaw agent`.

## Relacionado

- [Model Providers](/pt-BR/concepts/model-providers) — roteamento e autenticação de provedor
- [Agent Runtimes](/pt-BR/concepts/agent-runtimes) — Pi, Codex e outros runtimes de loop de agente
- [Model Failover](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Image Generation](/pt-BR/tools/image-generation) — configuração de modelo de imagem
- [Music Generation](/pt-BR/tools/music-generation) — configuração de modelo de música
- [Video Generation](/pt-BR/tools/video-generation) — configuração de modelo de vídeo
- [Configuration Reference](/pt-BR/gateway/config-agents#agent-defaults) — chaves de configuração de modelo

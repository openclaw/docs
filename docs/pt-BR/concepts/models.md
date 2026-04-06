---
read_when:
    - Adicionar ou modificar a CLI de models (models list/set/scan/aliases/fallbacks)
    - Alterar o comportamento de fallback de model ou a UX de seleção
    - Atualizar as sondagens de scan de model (tools/images)
summary: 'CLI de Models: listar, definir, aliases, fallbacks, scan, status'
title: CLI de Models
x-i18n:
    generated_at: "2026-04-06T03:07:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 299602ccbe0c3d6bbdb2deab22bc60e1300ef6843ed0b8b36be574cc0213c155
    source_path: concepts/models.md
    workflow: 15
---

# CLI de Models

Veja [/concepts/model-failover](/pt-BR/concepts/model-failover) para rotação de perfis de auth,
cooldowns e como isso interage com fallbacks.
Visão geral rápida de provedores + exemplos: [/concepts/model-providers](/pt-BR/concepts/model-providers).

## Como a seleção de model funciona

O OpenClaw seleciona models nesta ordem:

1. **Model** primário (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Fallbacks** em `agents.defaults.model.fallbacks` (em ordem).
3. **Failover de auth do provedor** acontece dentro de um provedor antes de passar para o
   próximo model.

Relacionados:

- `agents.defaults.models` é a allowlist/catálogo de models que o OpenClaw pode usar (além de aliases).
- `agents.defaults.imageModel` é usado **somente quando** o model primário não pode aceitar imagens.
- `agents.defaults.pdfModel` é usado pela tool `pdf`. Se omitido, a tool
  recorre a `agents.defaults.imageModel`, depois ao model de sessão/padrão resolvido.
- `agents.defaults.imageGenerationModel` é usado pela capability compartilhada de geração de imagens. Se omitido, `image_generate` ainda pode inferir um padrão de provedor com auth. Ele tenta primeiro o provedor padrão atual e depois os demais provedores de geração de imagem registrados, em ordem de provider-id. Se você definir um provedor/model específico, também configure a auth/chave de API desse provedor.
- `agents.defaults.musicGenerationModel` é usado pela capability compartilhada de geração de música. Se omitido, `music_generate` ainda pode inferir um padrão de provedor com auth. Ele tenta primeiro o provedor padrão atual e depois os demais provedores de geração de música registrados, em ordem de provider-id. Se você definir um provedor/model específico, também configure a auth/chave de API desse provedor.
- `agents.defaults.videoGenerationModel` é usado pela capability compartilhada de geração de vídeo. Se omitido, `video_generate` ainda pode inferir um padrão de provedor com auth. Ele tenta primeiro o provedor padrão atual e depois os demais provedores de geração de vídeo registrados, em ordem de provider-id. Se você definir um provedor/model específico, também configure a auth/chave de API desse provedor.
- Os padrões por agente podem sobrescrever `agents.defaults.model` por meio de `agents.list[].model` junto com bindings (veja [/concepts/multi-agent](/pt-BR/concepts/multi-agent)).

## Política rápida de model

- Defina seu primário como o model mais forte e de geração mais recente disponível para você.
- Use fallbacks para tarefas sensíveis a custo/latência e chat de menor importância.
- Para agentes com tools habilitadas ou entradas não confiáveis, evite tiers de model mais antigos/mais fracos.

## Onboarding (recomendado)

Se você não quiser editar a config manualmente, execute o onboarding:

```bash
openclaw onboard
```

Ele pode configurar model + auth para provedores comuns, incluindo **OpenAI Code (Codex)
subscription** (OAuth) e **Anthropic** (chave de API ou Claude CLI).

## Chaves de config (visão geral)

- `agents.defaults.model.primary` e `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` e `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` e `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` e `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` e `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + parâmetros do provedor)
- `models.providers` (provedores personalizados gravados em `models.json`)

As referências de model são normalizadas para minúsculas. Aliases de provedor como `z.ai/*` são normalizados
para `zai/*`.

Exemplos de configuração de provedor (incluindo OpenCode) estão em
[/providers/opencode](/pt-BR/providers/opencode).

## "Model is not allowed" (e por que as respostas param)

Se `agents.defaults.models` estiver definido, ele se torna a **allowlist** para `/model` e para
sobrescritas de sessão. Quando um usuário seleciona um model que não está nessa allowlist,
o OpenClaw retorna:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Isso acontece **antes** de uma resposta normal ser gerada, então a mensagem pode dar a impressão
de que “não respondeu”. A correção é:

- Adicionar o model a `agents.defaults.models`, ou
- Limpar a allowlist (remover `agents.defaults.models`), ou
- Escolher um model de `/model list`.

Exemplo de config de allowlist:

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

## Trocando models no chat (`/model`)

Você pode trocar models para a sessão atual sem reiniciar:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Observações:

- `/model` (e `/model list`) é um seletor compacto e numerado (família de model + provedores disponíveis).
- No Discord, `/model` e `/models` abrem um seletor interativo com menus suspensos de provedor e model, além de uma etapa de Submit.
- `/model <#>` seleciona a partir desse seletor.
- `/model` persiste imediatamente a nova seleção da sessão.
- Se o agente estiver ocioso, a próxima execução usará o novo model imediatamente.
- Se uma execução já estiver ativa, o OpenClaw marca uma troca ao vivo como pendente e só reinicia no novo model em um ponto limpo de retry.
- Se a atividade de tool ou a saída da resposta já tiver começado, a troca pendente pode ficar na fila até uma oportunidade posterior de retry ou o próximo turno do usuário.
- `/model status` é a visualização detalhada (candidatos de auth e, quando configurado, `baseUrl` + modo `api` do endpoint do provedor).
- As referências de model são analisadas dividindo na **primeira** `/`. Use `provider/model` ao digitar `/model <ref>`.
- Se o próprio ID do model contiver `/` (estilo OpenRouter), você deverá incluir o prefixo do provedor (exemplo: `/model openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw resolve a entrada nesta ordem:
  1. correspondência de alias
  2. correspondência única de provedor configurado para esse id exato de model sem prefixo
  3. fallback obsoleto para o provedor padrão configurado
     Se esse provedor não expuser mais o model padrão configurado, o OpenClaw
     em vez disso recorre ao primeiro provedor/model configurado para evitar
     expor um padrão obsoleto de provedor removido.

Comportamento/config completos do comando: [Comandos de barra](/pt-BR/tools/slash-commands).

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

Mostra os models configurados por padrão. Flags úteis:

- `--all`: catálogo completo
- `--local`: apenas provedores locais
- `--provider <name>`: filtrar por provedor
- `--plain`: um model por linha
- `--json`: saída legível por máquina

### `models status`

Mostra o model primário resolvido, fallbacks, model de imagem e uma visão geral de auth
dos provedores configurados. Ele também mostra o status de expiração do OAuth para perfis encontrados
no armazenamento de auth (avisa dentro de 24h por padrão). `--plain` imprime apenas o
model primário resolvido.
O status de OAuth é sempre mostrado (e incluído na saída `--json`). Se um provedor configurado
não tiver credenciais, `models status` imprime uma seção **Missing auth**.
O JSON inclui `auth.oauth` (janela de aviso + perfis) e `auth.providers`
(auth efetiva por provedor, incluindo credenciais vindas de env). `auth.oauth`
é apenas a integridade dos perfis do armazenamento de auth; provedores somente com env não aparecem ali.
Use `--check` para automação (saída `1` quando ausente/expirado, `2` quando prestes a expirar).
Use `--probe` para verificações de auth ao vivo; as linhas da sondagem podem vir de perfis de auth, credenciais de env
ou `models.json`.
Se `auth.order.<provider>` explícito omitir um perfil armazenado, a sondagem reportará
`excluded_by_auth_order` em vez de tentar usá-lo. Se a auth existir, mas nenhum model sondável
puder ser resolvido para esse provedor, a sondagem reportará `status: no_model`.

A escolha de auth depende do provedor/conta. Para hosts de gateway sempre ativos, chaves de API
costumam ser a opção mais previsível; a reutilização do Claude CLI e perfis OAuth/token existentes do Anthropic
também são compatíveis.

Exemplo (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Scan (models gratuitos do OpenRouter)

`openclaw models scan` inspeciona o **catálogo de models gratuitos** do OpenRouter e pode
opcionalmente sondar models para suporte a tools e imagens.

Principais flags:

- `--no-probe`: pula as sondagens ao vivo (somente metadados)
- `--min-params <b>`: tamanho mínimo de parâmetros (bilhões)
- `--max-age-days <days>`: pular models mais antigos
- `--provider <name>`: filtro de prefixo do provedor
- `--max-candidates <n>`: tamanho da lista de fallbacks
- `--set-default`: define `agents.defaults.model.primary` para a primeira seleção
- `--set-image`: define `agents.defaults.imageModel.primary` para a primeira seleção de imagem

A sondagem requer uma chave de API do OpenRouter (de perfis de auth ou
`OPENROUTER_API_KEY`). Sem uma chave, use `--no-probe` para listar apenas os candidatos.

Os resultados do scan são classificados por:

1. Suporte a imagem
2. Latência de tool
3. Tamanho de contexto
4. Contagem de parâmetros

Entrada

- Lista `/models` do OpenRouter (filtro `:free`)
- Requer chave de API do OpenRouter de perfis de auth ou `OPENROUTER_API_KEY` (veja [/environment](/pt-BR/help/environment))
- Filtros opcionais: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Controles de sondagem: `--timeout`, `--concurrency`

Quando executado em um TTY, você pode selecionar fallbacks interativamente. Em modo não interativo,
passe `--yes` para aceitar os padrões.

## Registro de models (`models.json`)

Provedores personalizados em `models.providers` são gravados em `models.json` no
diretório do agente (padrão `~/.openclaw/agents/<agentId>/agent/models.json`). Esse arquivo
é mesclado por padrão, a menos que `models.mode` seja definido como `replace`.

Precedência do modo de mesclagem para IDs de provedor correspondentes:

- `baseUrl` não vazio já presente no `models.json` do agente prevalece.
- `apiKey` não vazio no `models.json` do agente prevalece somente quando esse provedor não é gerenciado por SecretRef no contexto atual de config/perfil de auth.
- Valores `apiKey` de provedores gerenciados por SecretRef são atualizados a partir de marcadores da origem (`ENV_VAR_NAME` para referências de env, `secretref-managed` para referências file/exec) em vez de persistir secrets resolvidos.
- Valores de header de provedores gerenciados por SecretRef são atualizados a partir de marcadores da origem (`secretref-env:ENV_VAR_NAME` para referências de env, `secretref-managed` para referências file/exec).
- `apiKey`/`baseUrl` vazios ou ausentes no agente recorrem a `models.providers` da config.
- Outros campos do provedor são atualizados a partir da config e de dados de catálogo normalizados.

A persistência de marcadores é autoritativa pela origem: o OpenClaw grava marcadores do snapshot de config da origem ativa (pré-resolução), não dos valores secretos resolvidos em runtime.
Isso se aplica sempre que o OpenClaw regenera `models.json`, incluindo caminhos acionados por comando como `openclaw agent`.

## Relacionados

- [Model Providers](/pt-BR/concepts/model-providers) — roteamento de provedor e auth
- [Model Failover](/pt-BR/concepts/model-failover) — cadeias de fallback
- [Image Generation](/pt-BR/tools/image-generation) — configuração de model de imagem
- [Music Generation](/tools/music-generation) — configuração de model de música
- [Video Generation](/tools/video-generation) — configuração de model de vídeo
- [Configuration Reference](/pt-BR/gateway/configuration-reference#agent-defaults) — chaves de config de model

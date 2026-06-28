---
read_when:
    - Você executou clawhub package validate e precisa corrigir os achados do Plugin
    - ClawHub rejeitou ou avisou sobre a publicação de um pacote de plugin
    - Você está atualizando os metadados do pacote do plugin antes do lançamento
summary: Corrigir achados de validação do pacote do Plugin ClawHub antes da publicação
title: Correções de validação de Plugin
x-i18n:
    generated_at: "2026-06-28T20:41:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correções de validação de Plugin

ClawHub valida pacotes de Plugin antes da publicação e também pode mostrar achados de varreduras automatizadas de pacotes. Esta página cobre achados voltados ao autor, ou seja, achados que o autor do Plugin pode corrigir nos metadados do pacote, no manifesto, nas importações do SDK ou no artefato publicado.

Ela não cobre achados internos de cobertura do Plugin Inspector. Se um relatório completo contiver códigos de manutenção do scanner sem orientação de remediação para o autor, eles são para mantenedores do OpenClaw, não para autores de Plugin.

Depois de aplicar qualquer correção, execute novamente:

```bash
clawhub package validate <path-to-plugin>
```

## Achados voltados ao autor

| Código                                  | Comece aqui                                                                                                                |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Adicionar metadados do pacote](/pt-BR/clawhub/plugin-validation-fixes#package-json-missing)                                     |
| `package-openclaw-metadata-missing`     | [Adicionar o bloco openclaw do pacote](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                 |
| `package-openclaw-entry-missing`        | [Declarar pontos de entrada do pacote OpenClaw](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)           |
| `package-entrypoint-missing`            | [Publicar o ponto de entrada declarado](/pt-BR/clawhub/plugin-validation-fixes#package-entrypoint-missing)                       |
| `package-install-metadata-incomplete`   | [Completar metadados de instalação](/pt-BR/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                  |
| `package-plugin-api-compat-missing`     | [Declarar compatibilidade da API de Plugin](/pt-BR/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)            |
| `package-min-host-version-drift`        | [Alinhar versão mínima do host](/pt-BR/clawhub/plugin-validation-fixes#package-min-host-version-drift)                           |
| `package-manifest-version-drift`        | [Alinhar versões do pacote e do manifesto](/pt-BR/clawhub/plugin-validation-fixes#package-manifest-version-drift)                |
| `package-openclaw-unsupported-metadata` | [Remover metadados de pacote OpenClaw sem suporte](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Tornar o artefato npm empacotável](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                         |
| `package-npm-pack-entrypoint-missing`   | [Incluir pontos de entrada na saída do npm pack](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)     |
| `package-npm-pack-metadata-missing`     | [Incluir metadados na saída do npm pack](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)               |
| `manifest-name-missing`                 | [Adicionar um nome de exibição ao manifesto](/pt-BR/clawhub/plugin-validation-fixes#manifest-name-missing)                       |
| `manifest-unknown-fields`               | [Remover campos de manifesto sem suporte](/pt-BR/clawhub/plugin-validation-fixes#manifest-unknown-fields)                        |
| `manifest-unknown-contracts`            | [Remover chaves de contrato sem suporte](/pt-BR/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                      |
| `legacy-root-sdk-import`                | [Substituir importações raiz do SDK](/pt-BR/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                              |
| `reserved-sdk-import`                   | [Remover importações reservadas do SDK](/pt-BR/clawhub/plugin-validation-fixes#reserved-sdk-import)                              |
| `sdk-load-session-store`                | [Substituir acesso ao armazenamento de sessão inteiro](/pt-BR/clawhub/plugin-validation-fixes#sdk-load-session-store)            |
| `legacy-before-agent-start`             | [Substituir before_agent_start](/pt-BR/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                |
| `provider-auth-env-vars`                | [Mover variáveis de ambiente do provedor para metadados de configuração](/pt-BR/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Espelhar variáveis de ambiente do canal nos metadados atuais](/pt-BR/clawhub/plugin-validation-fixes#channel-env-vars)          |
| `security-manifest-schema-unavailable`  | [Remover referências indisponíveis a esquema de manifesto de segurança](/pt-BR/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Remover arquivos de manifesto de segurança sem suporte](/pt-BR/clawhub/plugin-validation-fixes#unrecognized-security-manifest)  |

## Metadados do pacote

### package-json-missing

A raiz do pacote não inclui `package.json`, então o ClawHub não consegue identificar o pacote npm, a versão, os pontos de entrada ou os metadados do OpenClaw.

- Adicione `package.json` com `name`, `version` e `type`.
- Adicione um bloco `openclaw` quando o pacote distribui um Plugin do OpenClaw.
- Use [Criando Plugins](/pt-BR/plugins/building-plugins) para um exemplo mínimo de pacote e [Manifesto de Plugin](/pt-BR/plugins/manifest#manifest-versus-packagejson) para a divisão entre pacote e manifesto.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

O pacote tem `package.json`, mas não declara metadados de pacote OpenClaw.

- Adicione `package.json#openclaw`.
- Inclua metadados de ponto de entrada, como `openclaw.extensions` ou `openclaw.runtimeExtensions`.
- Adicione metadados de compatibilidade e instalação quando o pacote for publicado ou instalado pelo ClawHub.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Os metadados do pacote existem, mas não declaram um ponto de entrada de runtime do OpenClaw.

- Adicione `openclaw.extensions` para pontos de entrada de Plugin nativo.
- Adicione `openclaw.runtimeExtensions` quando o pacote publicado deve carregar JavaScript compilado.
- Mantenha todos os caminhos de ponto de entrada dentro do diretório do pacote.
- Consulte [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints) e [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

O pacote declara um ponto de entrada do OpenClaw, mas o arquivo referenciado está ausente no pacote que está sendo validado.

- Verifique cada caminho em `openclaw.extensions`, `openclaw.runtimeExtensions`, `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compile o pacote se o ponto de entrada for gerado em `dist`.
- Atualize os metadados se o ponto de entrada tiver sido movido.
- Consulte [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

O ClawHub não consegue determinar como o pacote deve ser instalado ou atualizado.

- Preencha `openclaw.install` com a fonte de instalação compatível, como `clawhubSpec`, `npmSpec` ou `localPath`.
- Defina `openclaw.install.defaultChoice` quando mais de uma fonte de instalação estiver disponível.
- Use `openclaw.install.minHostVersion` para a versão mínima do host OpenClaw.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

O pacote não declara o intervalo da API de Plugin do OpenClaw que ele suporta.

- Adicione `openclaw.compat.pluginApi` ao `package.json`.
- Use a versão da API de Plugin do OpenClaw ou o piso semver com que você compilou e testou.
- Mantenha isso separado da versão do pacote. A versão do pacote descreve o lançamento do Plugin; `openclaw.compat.pluginApi` descreve o contrato da API do host.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

A versão mínima de host do pacote não corresponde aos metadados de versão do OpenClaw com os quais o pacote foi compilado.

- Verifique `openclaw.install.minHostVersion`.
- Verifique quaisquer metadados de build do OpenClaw no pacote, como a versão do OpenClaw usada durante o lançamento.
- Alinhe a versão mínima do host ao intervalo de versões do host que o pacote realmente suporta.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

A versão do pacote e a versão do manifesto do Plugin divergem.

- Prefira `package.json#version` como a versão de lançamento do pacote.
- Se `openclaw.plugin.json` também tiver `version`, atualize-o para corresponder ou remova metadados obsoletos de versão do manifesto quando os metadados do pacote forem a fonte autoritativa.
- Publique uma nova versão do pacote depois de alterar metadados publicados.
- Consulte [Manifesto de Plugin](/pt-BR/plugins/manifest).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

O bloco `package.json#openclaw` contém campos que não têm suporte como metadados de pacote OpenClaw.

- Remova campos sem suporte, como `openclaw.bundle`.
- Mantenha metadados de Plugin nativo em `openclaw.plugin.json`.
- Mantenha pontos de entrada de pacote, compatibilidade, instalação, configuração e metadados de catálogo em campos compatíveis de `package.json#openclaw`.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Artefato publicado

### package-npm-pack-unavailable

O pacote não pode ser empacotado no artefato que o ClawHub inspecionaria ou publicaria.

- Execute `npm pack --dry-run` a partir da raiz do pacote.
- Corrija metadados de pacote inválidos, scripts de ciclo de vida quebrados ou entradas de arquivos que fazem o empacotamento falhar.
- Remova `private: true` se este pacote for destinado à publicação pública.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

O pacote pode ser empacotado, mas o artefato empacotado não inclui os arquivos de ponto de entrada declarados em `package.json#openclaw`.

- Execute `npm pack --dry-run` e inspecione os arquivos que seriam incluídos.
- Compile os pontos de entrada gerados antes de empacotar.
- Atualize `files`, `.npmignore` ou a saída de build para que os pontos de entrada declarados sejam incluídos.
- Consulte [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

O artefato empacotado não contém metadados do OpenClaw que existem no pacote de origem.

- Execute `npm pack --dry-run` e inspecione os arquivos de metadados incluídos.
- Garanta que `package.json` inclua o bloco `openclaw` no artefato empacotado.
- Garanta que `openclaw.plugin.json` seja incluído quando o pacote for um Plugin nativo do OpenClaw.
- Atualize `files` ou `.npmignore` para que os metadados do pacote não sejam excluídos.
- Consulte [Criando Plugins](/pt-BR/plugins/building-plugins).
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Metadados do manifesto

### manifest-name-missing

O manifesto do Plugin nativo não inclui um nome de exibição.

- Adicione um campo `name` não vazio a `openclaw.plugin.json`.
- Mantenha `name` legível por humanos e mantenha `id` como o id de máquina estável.
- Consulte [Manifesto de Plugin](/pt-BR/plugins/manifest).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

O manifesto do Plugin tem campos de nível superior aos quais o OpenClaw não dá suporte.

- Compare cada campo de nível superior com a
  [referência de campos do manifesto](/pt-BR/plugins/manifest#top-level-field-reference).
- Remova campos personalizados de `openclaw.plugin.json`.
- Mova metadados de pacote ou instalação para campos compatíveis de `package.json#openclaw`
  em vez do manifesto.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

O manifesto declara chaves sem suporte dentro de `contracts`.

- Compare cada chave em `contracts` com a
  [referência de contratos](/pt-BR/plugins/manifest#contracts-reference).
- Remova chaves de contrato sem suporte.
- Mova o comportamento de runtime para o código de registro do plugin e mantenha `contracts`
  limitado a metadados estáticos de propriedade de capacidades.
- Execute novamente `clawhub package validate <path-to-plugin>`.

## SDK e migração de compatibilidade

### legacy-root-sdk-import

O plugin importa do módulo agregador raiz obsoleto do SDK:
`openclaw/plugin-sdk`.

- Substitua importações do módulo agregador raiz por importações de subcaminhos públicos focados.
- Use `openclaw/plugin-sdk/plugin-entry` para `definePluginEntry`.
- Use `openclaw/plugin-sdk/channel-core` para auxiliares de entrada de canal.
- Use [Convenções de importação](/pt-BR/plugins/building-plugins#import-conventions) e
  [subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths) para encontrar a importação restrita.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

O plugin importa um caminho do SDK reservado para plugins agrupados ou compatibilidade
interna.

- Substitua importações internas reservadas do SDK do OpenClaw por subcaminhos públicos documentados
  `openclaw/plugin-sdk/*`.
- Se o comportamento não tiver SDK público, mantenha o auxiliar dentro do seu pacote ou
  solicite uma API pública do OpenClaw.
- Use [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths) e
  [Migração do SDK](/pt-BR/plugins/sdk-migration) para escolher uma importação compatível.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

O plugin ainda usa o auxiliar obsoleto de armazenamento de sessão inteira
`loadSessionStore`.

- Use `getSessionEntry(...)` ou `listSessionEntries(...)` ao ler o estado da sessão.
- Use `patchSessionEntry(...)` ou `upsertSessionEntry(...)` ao gravar o estado da sessão.
- Evite carregar, modificar e salvar o objeto inteiro do armazenamento de sessão.
- Mantenha `loadSessionStore(...)` somente enquanto o intervalo de compatibilidade declarado
  ainda oferecer suporte a versões mais antigas do OpenClaw que o exigem.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

O plugin ainda usa o hook legado `before_agent_start`.

- Mova o trabalho de substituição de modelo ou provedor para `before_model_resolve`.
- Mova o trabalho de mutação de prompt ou contexto para `before_prompt_build`.
- Mantenha `before_agent_start` somente enquanto o intervalo de compatibilidade declarado ainda
  oferecer suporte a versões mais antigas do OpenClaw que o exigem.
- Consulte [Hooks](/pt-BR/plugins/hooks) e
  [Compatibilidade de plugins](/pt-BR/plugins/compatibility).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

O manifesto ainda usa metadados legados de autenticação de provedor `providerAuthEnvVars`.

- Espelhe metadados de variáveis de ambiente do provedor em `setup.providers[].envVars`.
- Mantenha `providerAuthEnvVars` apenas como metadados de compatibilidade enquanto o intervalo
  compatível do OpenClaw ainda precisar dele.
- Consulte [referência de setup](/pt-BR/plugins/manifest#setup-reference) e
  [Migração do SDK](/pt-BR/plugins/sdk-migration).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### channel-env-vars

O manifesto usa metadados legados ou mais antigos de variáveis de ambiente de canal sem os metadados
atuais de setup ou configuração que o ClawHub espera.

- Mantenha os metadados de variáveis de ambiente do canal declarativos para que o OpenClaw possa inspecionar o status de setup
  sem carregar o runtime do canal.
- Espelhe o setup de canal orientado por variáveis de ambiente para os metadados atuais de setup, configuração de canal ou
  canal de pacote usados pelo formato do seu plugin.
- Mantenha `channelEnvVars` apenas como metadados de compatibilidade enquanto versões mais antigas compatíveis
  do OpenClaw ainda o exigirem.
- Consulte [Manifesto do plugin](/pt-BR/plugins/manifest) e
  [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Manifesto de segurança

### security-manifest-schema-unavailable

O pacote distribui `openclaw.security.json` com uma referência de esquema que o ClawHub
não reconhece como disponível.

- Remova a URL do esquema se ela for apenas consultiva.
- Use um esquema versionado documentado somente depois que o OpenClaw publicar um.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### unrecognized-security-manifest

O pacote distribui um arquivo de manifesto de segurança sem suporte.

- Remova `openclaw.security.json` até que o OpenClaw documente um esquema versionado de manifesto de segurança
  e o comportamento do ClawHub.
- Mantenha o comportamento sensível à segurança documentado na documentação pública do seu pacote ou no
  README até que o contrato do manifesto exista.
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Relacionados

- [CLI do ClawHub](/pt-BR/clawhub/cli)
- [Publicação no ClawHub](/pt-BR/clawhub/publishing)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Manifesto do plugin](/pt-BR/plugins/manifest)
- [Pontos de entrada do plugin](/pt-BR/plugins/sdk-entrypoints)
- [Compatibilidade de plugins](/pt-BR/plugins/compatibility)

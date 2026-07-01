---
read_when:
    - Você executou clawhub package validate e precisa corrigir as descobertas do plugin
    - ClawHub rejeitou ou alertou sobre a publicação de um pacote de plugin
    - Você está atualizando os metadados do pacote do plugin antes do lançamento
summary: Corrigir as constatações de validação do pacote de Plugin do ClawHub antes da publicação
title: Correções de validação de Plugin
x-i18n:
    generated_at: "2026-07-01T12:51:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correções de validação de Plugin

O ClawHub valida pacotes de Plugin antes da publicação e também pode mostrar descobertas de
varreduras automatizadas de pacotes. Esta página aborda descobertas voltadas para autores, ou seja,
descobertas que o autor do Plugin pode corrigir nos metadados do pacote, manifesto, importações do SDK
ou artefato publicado.

Ela não aborda descobertas internas de cobertura do Plugin Inspector. Se um relatório completo
contiver códigos de manutenção do scanner sem orientação de correção para o autor, eles
são para mantenedores do OpenClaw, não para autores de Plugin.

Depois de aplicar qualquer correção, execute novamente:

```bash
clawhub package validate <path-to-plugin>
```

## Descobertas voltadas para autores

| Código                                  | Comece aqui                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Adicionar metadados do pacote](/pt-BR/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [Adicionar o bloco openclaw do pacote](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [Declarar pontos de entrada do pacote OpenClaw](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [Publicar o ponto de entrada declarado](/pt-BR/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [Completar metadados de instalação](/pt-BR/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Declarar compatibilidade da API de Plugin](/pt-BR/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [Alinhar versão mínima do host](/pt-BR/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [Alinhar versões do pacote e do manifesto](/pt-BR/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [Remover metadados de pacote OpenClaw sem suporte](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [Tornar o artefato npm empacotável](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [Incluir pontos de entrada na saída do npm pack](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [Incluir metadados na saída do npm pack](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [Adicionar um nome de exibição do manifesto](/pt-BR/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [Remover campos de manifesto sem suporte](/pt-BR/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [Remover chaves de contrato sem suporte](/pt-BR/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [Substituir importações raiz do SDK](/pt-BR/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [Remover importações reservadas do SDK](/pt-BR/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [Substituir acesso ao armazenamento de sessão inteiro](/pt-BR/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [Substituir gravações no armazenamento de sessão inteiro](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [Substituir auxiliares de caminho de arquivo de sessão](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [Substituir destinos legados de arquivo de transcrição](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [Substituir auxiliares de transcrição de baixo nível](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [Substituir before_agent_start](/pt-BR/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [Mover variáveis de ambiente de provedor para metadados de configuração](/pt-BR/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [Espelhar variáveis de ambiente de canal nos metadados atuais](/pt-BR/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [Remover referências indisponíveis de esquema de manifesto de segurança](/pt-BR/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Remover arquivos de manifesto de segurança sem suporte](/pt-BR/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## Metadados do pacote

### package-json-missing

A raiz do pacote não inclui `package.json`, então o ClawHub não consegue identificar o
pacote npm, a versão, os pontos de entrada ou os metadados do OpenClaw.

- Adicione `package.json` com `name`, `version` e `type`.
- Adicione um bloco `openclaw` quando o pacote entregar um Plugin do OpenClaw.
- Use [Criação de plugins](/pt-BR/plugins/building-plugins) para um exemplo mínimo de pacote
  e [Manifesto de Plugin](/pt-BR/plugins/manifest#manifest-versus-packagejson)
  para a separação entre pacote e manifesto.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

O pacote tem `package.json`, mas não declara metadados de pacote
OpenClaw.

- Adicione `package.json#openclaw`.
- Inclua metadados de ponto de entrada, como `openclaw.extensions` ou
  `openclaw.runtimeExtensions`.
- Adicione metadados de compatibilidade e instalação quando o pacote for publicado ou
  instalado pelo ClawHub.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Os metadados do pacote existem, mas não declaram um ponto de entrada de runtime
do OpenClaw.

- Adicione `openclaw.extensions` para pontos de entrada de Plugin nativo.
- Adicione `openclaw.runtimeExtensions` quando o pacote publicado deve carregar JavaScript
  compilado.
- Mantenha todos os caminhos de ponto de entrada dentro do diretório do pacote.
- Consulte [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints) e
  [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

O pacote declara um ponto de entrada OpenClaw, mas o arquivo referenciado está ausente
do pacote que está sendo validado.

- Verifique cada caminho em `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compile o pacote se o ponto de entrada for gerado em `dist`.
- Atualize os metadados se o ponto de entrada tiver sido movido.
- Consulte [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

O ClawHub não consegue determinar como o pacote deve ser instalado ou atualizado.

- Preencha `openclaw.install` com a origem de instalação compatível, como
  `clawhubSpec`, `npmSpec` ou `localPath`.
- Defina `openclaw.install.defaultChoice` quando mais de uma origem de instalação estiver
  disponível.
- Use `openclaw.install.minHostVersion` para a versão mínima do host OpenClaw.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

O pacote não declara o intervalo de API de Plugin do OpenClaw que ele suporta.

- Adicione `openclaw.compat.pluginApi` ao `package.json`.
- Use a versão da API de Plugin do OpenClaw ou o piso semver com o qual você compilou e testou.
- Mantenha isso separado da versão do pacote. A versão do pacote descreve o
  lançamento do Plugin; `openclaw.compat.pluginApi` descreve o contrato de API do host.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

A versão mínima do host do pacote não corresponde aos metadados de versão do OpenClaw
com os quais o pacote foi compilado.

- Verifique `openclaw.install.minHostVersion`.
- Verifique quaisquer metadados de build do OpenClaw no pacote, como a versão do OpenClaw
  usada durante o lançamento.
- Alinhe a versão mínima do host com o intervalo de versões do host que o pacote
  realmente suporta.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

A versão do pacote e a versão do manifesto do Plugin divergem.

- Prefira `package.json#version` como a versão de lançamento do pacote.
- Se `openclaw.plugin.json` também tiver `version`, atualize-a para corresponder ou remova
  metadados obsoletos de versão do manifesto quando os metadados do pacote forem autoritativos.
- Publique uma nova versão do pacote depois de alterar metadados publicados.
- Consulte [Manifesto de Plugin](/pt-BR/plugins/manifest).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

O bloco `package.json#openclaw` contém campos que não são metadados de pacote
OpenClaw compatíveis.

- Remova campos sem suporte, como `openclaw.bundle`.
- Mantenha metadados de Plugin nativo em `openclaw.plugin.json`.
- Mantenha pontos de entrada, compatibilidade, instalação, configuração e metadados de catálogo do pacote
  em campos compatíveis de `package.json#openclaw`.
- Consulte [campos de package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Artefato publicado

### package-npm-pack-unavailable

O pacote não pode ser empacotado no artefato que o ClawHub inspecionaria ou
publicaria.

- Execute `npm pack --dry-run` a partir da raiz do pacote.
- Corrija metadados de pacote inválidos, scripts de ciclo de vida quebrados ou entradas de arquivos que
  fazem o empacotamento falhar.
- Remova `private: true` se este pacote for destinado à publicação pública.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-npm-pack-entrypoint-missing

O pacote pode ser empacotado, mas o artefato empacotado não inclui os
arquivos de ponto de entrada declarados em `package.json#openclaw`.

- Execute `npm pack --dry-run` e inspecione os arquivos que seriam incluídos.
- Compile pontos de entrada gerados antes de empacotar.
- Atualize `files`, `.npmignore` ou a saída de build para que os pontos de entrada declarados sejam
  incluídos.
- Consulte [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-npm-pack-metadata-missing

O artefato empacotado não contém metadados do OpenClaw que existem no seu pacote
de origem.

- Execute `npm pack --dry-run` e inspecione os arquivos de metadados incluídos.
- Garanta que `package.json` inclua o bloco `openclaw` no artefato empacotado.
- Garanta que `openclaw.plugin.json` seja incluído quando o pacote for um Plugin nativo
  do OpenClaw.
- Atualize `files` ou `.npmignore` para que os metadados do pacote não sejam excluídos.
- Consulte [Criação de plugins](/pt-BR/plugins/building-plugins).
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Metadados do manifesto

### manifest-name-missing

O manifesto do plugin nativo não inclui um nome de exibição.

- Adicione um campo `name` não vazio a `openclaw.plugin.json`.
- Mantenha `name` legível para humanos e mantenha `id` como o id de máquina estável.
- Consulte [Manifesto do Plugin](/pt-BR/plugins/manifest).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

O manifesto do plugin tem campos de nível superior que o OpenClaw não oferece suporte.

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

## Migração de SDK e compatibilidade

### legacy-root-sdk-import

O plugin importa do barrel raiz obsoleto do SDK:
`openclaw/plugin-sdk`.

- Substitua importações do barrel raiz por importações focadas de subcaminhos públicos.
- Use `openclaw/plugin-sdk/plugin-entry` para `definePluginEntry`.
- Use `openclaw/plugin-sdk/channel-core` para helpers de entrada de canal.
- Use [Convenções de importação](/pt-BR/plugins/building-plugins#import-conventions) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths) para encontrar a importação estreita.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

O plugin importa um caminho de SDK reservado para plugins empacotados ou compatibilidade
interna.

- Substitua importações internas reservadas do SDK do OpenClaw por subcaminhos públicos documentados
  `openclaw/plugin-sdk/*`.
- Se o comportamento não tiver um SDK público, mantenha o helper dentro do seu pacote ou
  solicite uma API pública do OpenClaw.
- Use [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths) e
  [Migração do SDK](/pt-BR/plugins/sdk-migration) para escolher uma importação compatível.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

O plugin ainda usa o helper obsoleto de armazenamento de sessão completo
`loadSessionStore`.

- Use `getSessionEntry(...)` ou `listSessionEntries(...)` ao ler estado de sessão.
- Use `patchSessionEntry(...)` ou `upsertSessionEntry(...)` ao gravar estado de sessão.
- Evite carregar, modificar e salvar o objeto inteiro de armazenamento de sessão.
- Mantenha `loadSessionStore(...)` somente enquanto seu intervalo de compatibilidade declarado
  ainda oferecer suporte a versões mais antigas do OpenClaw que exigem isso.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

O plugin ainda usa um helper obsoleto de gravação de armazenamento de sessão completo, como
`saveSessionStore` ou `updateSessionStore`.

- Use `patchSessionEntry(...)` ao atualizar campos em uma entrada de sessão existente.
- Use `upsertSessionEntry(...)` ao substituir ou criar uma entrada de sessão.
- Evite carregar, modificar e salvar o objeto inteiro de armazenamento de sessão.
- Mantenha helpers de gravação do armazenamento completo somente enquanto seu intervalo de compatibilidade declarado
  ainda oferecer suporte a versões mais antigas do OpenClaw que exigem isso.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

O plugin ainda usa helpers obsoletos de caminhos de arquivo de sessão, como
`resolveSessionFilePath` ou `resolveAndPersistSessionFile`.

- Use `getSessionEntry(...)` para ler metadados de sessão por agente e identidade de sessão.
- Use `patchSessionEntry(...)` ou `upsertSessionEntry(...)` para persistir metadados de sessão.
- Use identidade de transcrição ou helpers de destino quando o código estiver preparando uma
  operação de transcrição.
- Não persista nem dependa de caminhos de arquivo de transcrição legados.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

O plugin ainda usa o helper obsoleto de destino de arquivo de transcrição
`resolveSessionTranscriptLegacyFileTarget`.

- Use `resolveSessionTranscriptIdentity(...)` quando o código precisar apenas da identidade pública
  da sessão.
- Use `resolveSessionTranscriptTarget(...)` quando o código precisar de um destino estruturado
  de operação de transcrição.
- Evite ler ou construir destinos de arquivo de transcrição legados diretamente.
- Mantenha o helper legado somente enquanto seu intervalo de compatibilidade declarado ainda
  oferecer suporte a versões mais antigas do OpenClaw que exigem isso.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

O plugin ainda usa helpers obsoletos de transcrição de baixo nível, como
`appendSessionTranscriptMessage` ou `emitSessionTranscriptUpdate`.

- Use `appendSessionTranscriptMessageByIdentity(...)` para anexos de transcrição.
- Use `publishSessionTranscriptUpdateByIdentity(...)` para notificações de atualização de transcrição.
- Prefira a superfície estruturada de runtime de transcrição para que o OpenClaw possa aplicar os
  limites de transação e o tratamento de identidade corretos.
- Mantenha helpers de transcrição de baixo nível somente enquanto seu intervalo de compatibilidade declarado
  ainda oferecer suporte a versões mais antigas do OpenClaw que exigem isso.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

O plugin ainda usa o hook legado `before_agent_start`.

- Mova o trabalho de substituição de modelo ou provedor para `before_model_resolve`.
- Mova o trabalho de mutação de prompt ou contexto para `before_prompt_build`.
- Mantenha `before_agent_start` somente enquanto seu intervalo de compatibilidade declarado ainda
  oferecer suporte a versões mais antigas do OpenClaw que exigem isso.
- Consulte [Hooks](/pt-BR/plugins/hooks) e
  [Compatibilidade de Plugin](/pt-BR/plugins/compatibility).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

O manifesto ainda usa metadados legados de autenticação de provedor `providerAuthEnvVars`.

- Espelhe os metadados de variáveis de ambiente do provedor em `setup.providers[].envVars`.
- Mantenha `providerAuthEnvVars` apenas como metadados de compatibilidade enquanto seu intervalo
  compatível do OpenClaw ainda precisar disso.
- Consulte [referência de setup](/pt-BR/plugins/manifest#setup-reference) e
  [Migração do SDK](/pt-BR/plugins/sdk-migration).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### channel-env-vars

O manifesto usa metadados legados ou antigos de variáveis de ambiente de canal sem os metadados
atuais de setup ou configuração que o ClawHub espera.

- Mantenha os metadados de variáveis de ambiente de canal declarativos para que o OpenClaw possa inspecionar o status de setup
  sem carregar o runtime do canal.
- Espelhe o setup de canal orientado por variáveis de ambiente nos metadados atuais de setup, configuração de canal ou
  canal de pacote usados pelo formato do seu plugin.
- Mantenha `channelEnvVars` apenas como metadados de compatibilidade enquanto versões mais antigas compatíveis
  do OpenClaw ainda exigirem isso.
- Consulte [Manifesto do Plugin](/pt-BR/plugins/manifest) e
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
- Mantenha comportamentos sensíveis à segurança documentados na documentação pública do seu pacote ou
  no README até que o contrato do manifesto exista.
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Relacionados

- [CLI do ClawHub](/pt-BR/clawhub/cli)
- [Publicação no ClawHub](/pt-BR/clawhub/publishing)
- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Manifesto do Plugin](/pt-BR/plugins/manifest)
- [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints)
- [Compatibilidade de Plugin](/pt-BR/plugins/compatibility)

---
read_when:
    - Você executou clawhub package validate e precisa corrigir os achados do plugin
    - ClawHub rejeitou ou alertou sobre uma publicação de pacote de plugin
    - Você está atualizando os metadados do pacote do Plugin antes do lançamento
summary: Corrija os apontamentos de validação do pacote do Plugin ClawHub antes de publicar
title: Correções de validação de Plugin
x-i18n:
    generated_at: "2026-07-04T15:10:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Correções de validação de Plugin

ClawHub valida pacotes de plugin antes da publicação e também pode mostrar descobertas de
varreduras automatizadas de pacotes. Esta página aborda descobertas voltadas ao autor, ou seja,
descobertas que o autor do plugin pode corrigir nos metadados do pacote, no manifesto, nas importações do SDK
ou no artefato publicado.

Ela não aborda descobertas internas de cobertura do Plugin Inspector. Se um relatório completo
contiver códigos de manutenção do scanner sem orientação de correção para o autor, eles
são destinados aos mantenedores do OpenClaw, não aos autores de plugins.

Depois de aplicar qualquer correção, execute novamente:

```bash
clawhub package validate <path-to-plugin>
```

## Descobertas voltadas ao autor

| Código                                  | Comece aqui                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [Adicione metadados do pacote](/pt-BR/clawhub/plugin-validation-fixes#package-json-missing)                                       |
| `package-openclaw-metadata-missing`     | [Adicione o bloco openclaw do pacote](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                   |
| `package-openclaw-entry-missing`        | [Declare pontos de entrada de pacote do OpenClaw](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)          |
| `package-entrypoint-missing`            | [Publique o ponto de entrada declarado](/pt-BR/clawhub/plugin-validation-fixes#package-entrypoint-missing)                        |
| `package-install-metadata-incomplete`   | [Complete os metadados de instalação](/pt-BR/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                 |
| `package-plugin-api-compat-missing`     | [Declare compatibilidade com a API de plugin](/pt-BR/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)           |
| `package-min-host-version-drift`        | [Alinhe a versão mínima do host](/pt-BR/clawhub/plugin-validation-fixes#package-min-host-version-drift)                           |
| `package-manifest-version-drift`        | [Alinhe as versões do pacote e do manifesto](/pt-BR/clawhub/plugin-validation-fixes#package-manifest-version-drift)               |
| `package-openclaw-unsupported-metadata` | [Remova metadados de pacote OpenClaw não compatíveis](/pt-BR/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata) |
| `package-npm-pack-unavailable`          | [Torne o artefato npm empacotável](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                           |
| `package-npm-pack-entrypoint-missing`   | [Inclua pontos de entrada na saída de npm pack](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)        |
| `package-npm-pack-metadata-missing`     | [Inclua metadados na saída de npm pack](/pt-BR/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                 |
| `manifest-name-missing`                 | [Adicione um nome de exibição ao manifesto](/pt-BR/clawhub/plugin-validation-fixes#manifest-name-missing)                         |
| `manifest-unknown-fields`               | [Remova campos de manifesto não compatíveis](/pt-BR/clawhub/plugin-validation-fixes#manifest-unknown-fields)                      |
| `manifest-unknown-contracts`            | [Remova chaves de contrato não compatíveis](/pt-BR/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                    |
| `legacy-root-sdk-import`                | [Substitua importações do SDK raiz](/pt-BR/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                |
| `reserved-sdk-import`                   | [Remova importações reservadas do SDK](/pt-BR/clawhub/plugin-validation-fixes#reserved-sdk-import)                                |
| `sdk-load-session-store`                | [Substitua acesso ao armazenamento de sessão inteiro](/pt-BR/clawhub/plugin-validation-fixes#sdk-load-session-store)              |
| `sdk-session-store-write`               | [Substitua gravações no armazenamento de sessão inteiro](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-store-write)          |
| `sdk-session-file-helper`               | [Substitua auxiliares de caminho de arquivo de sessão](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-file-helper)            |
| `sdk-session-transcript-file-target`    | [Substitua destinos legados de arquivo de transcrição](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target) |
| `sdk-session-transcript-low-level`      | [Substitua auxiliares de transcrição de baixo nível](/pt-BR/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)     |
| `legacy-before-agent-start`             | [Substitua before_agent_start](/pt-BR/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                  |
| `provider-auth-env-vars`                | [Mova variáveis de ambiente do provedor para metadados de configuração](/pt-BR/clawhub/plugin-validation-fixes#provider-auth-env-vars) |
| `channel-env-vars`                      | [Espelhe variáveis de ambiente do canal nos metadados atuais](/pt-BR/clawhub/plugin-validation-fixes#channel-env-vars)            |
| `security-manifest-schema-unavailable`  | [Remova referências indisponíveis de esquema de manifesto de segurança](/pt-BR/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [Remova arquivos de manifesto de segurança não compatíveis](/pt-BR/clawhub/plugin-validation-fixes#unrecognized-security-manifest) |

## Metadados do pacote

### package-json-missing

A raiz do pacote não inclui `package.json`, portanto o ClawHub não consegue identificar o
pacote npm, a versão, os pontos de entrada ou os metadados do OpenClaw.

- Adicione `package.json` com `name`, `version` e `type`.
- Adicione um bloco `openclaw` quando o pacote envia um plugin OpenClaw.
- Use [Como criar plugins](/pt-BR/plugins/building-plugins) para um exemplo mínimo de pacote
  e [Manifesto de Plugin](/pt-BR/plugins/manifest#manifest-versus-packagejson)
  para a separação entre pacote e manifesto.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-metadata-missing

O pacote tem `package.json`, mas não declara metadados de pacote do OpenClaw.

- Adicione `package.json#openclaw`.
- Inclua metadados de ponto de entrada, como `openclaw.extensions` ou
  `openclaw.runtimeExtensions`.
- Adicione metadados de compatibilidade e instalação quando o pacote será publicado ou
  instalado por meio do ClawHub.
- Consulte [campos package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-entry-missing

Os metadados do pacote existem, mas não declaram um ponto de entrada de runtime
do OpenClaw.

- Adicione `openclaw.extensions` para pontos de entrada de plugin nativos.
- Adicione `openclaw.runtimeExtensions` quando o pacote publicado deve carregar JavaScript
  compilado.
- Mantenha todos os caminhos de ponto de entrada dentro do diretório do pacote.
- Consulte [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints) e
  [campos package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-entrypoint-missing

O pacote declara um ponto de entrada do OpenClaw, mas o arquivo referenciado está ausente
no pacote que está sendo validado.

- Verifique cada caminho em `openclaw.extensions`, `openclaw.runtimeExtensions`,
  `openclaw.setupEntry` e `openclaw.runtimeSetupEntry`.
- Compile o pacote se o ponto de entrada for gerado em `dist`.
- Atualize os metadados se o ponto de entrada foi movido.
- Consulte [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-install-metadata-incomplete

O ClawHub não consegue determinar como o pacote deve ser instalado ou atualizado.

- Preencha `openclaw.install` com a fonte de instalação compatível, como
  `clawhubSpec`, `npmSpec` ou `localPath`.
- Defina `openclaw.install.defaultChoice` quando mais de uma fonte de instalação estiver
  disponível.
- Use `openclaw.install.minHostVersion` para a versão mínima do host OpenClaw.
- Consulte [campos package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-plugin-api-compat-missing

O pacote não declara o intervalo da API de plugin do OpenClaw que ele suporta.

- Adicione `openclaw.compat.pluginApi` a `package.json`.
- Use a versão da API de plugin do OpenClaw ou o piso semver contra o qual você compilou e testou.
- Mantenha isso separado da versão do pacote. A versão do pacote descreve a
  versão do plugin; `openclaw.compat.pluginApi` descreve o contrato da API do host.
- Consulte [campos package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-min-host-version-drift

A versão mínima de host do pacote não corresponde aos metadados de versão do OpenClaw
contra os quais o pacote foi compilado.

- Verifique `openclaw.install.minHostVersion`.
- Verifique quaisquer metadados de build do OpenClaw no pacote, como a versão do OpenClaw
  usada durante a versão.
- Alinhe a versão mínima do host com o intervalo de versões do host que o pacote
  realmente suporta.
- Consulte [campos package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-manifest-version-drift

A versão do pacote e a versão do manifesto do plugin divergem.

- Prefira `package.json#version` como a versão de lançamento do pacote.
- Se `openclaw.plugin.json` também tiver `version`, atualize-a para corresponder ou remova
  metadados obsoletos de versão do manifesto quando os metadados do pacote forem autoritativos.
- Publique uma nova versão do pacote depois de alterar metadados publicados.
- Consulte [Manifesto de Plugin](/pt-BR/plugins/manifest).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### package-openclaw-unsupported-metadata

O bloco `package.json#openclaw` contém campos que não são metadados de pacote
OpenClaw compatíveis.

- Remova campos não compatíveis, como `openclaw.bundle`.
- Mantenha metadados de plugin nativo em `openclaw.plugin.json`.
- Mantenha pontos de entrada, compatibilidade, instalação, configuração e metadados de catálogo do pacote
  nos campos compatíveis de `package.json#openclaw`.
- Consulte [campos package.json que afetam a descoberta](/pt-BR/plugins/manifest#packagejson-fields-that-affect-discovery).
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
fonte.

- Execute `npm pack --dry-run` e inspecione os arquivos de metadados incluídos.
- Garanta que `package.json` inclua o bloco `openclaw` no artefato empacotado.
- Garanta que `openclaw.plugin.json` esteja incluído quando o pacote for um plugin
  OpenClaw nativo.
- Atualize `files` ou `.npmignore` para que os metadados do pacote não sejam excluídos.
- Consulte [Como criar plugins](/pt-BR/plugins/building-plugins).
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Metadados do manifesto

### manifest-name-missing

O manifesto nativo do Plugin não inclui um nome de exibição.

- Adicione um campo `name` não vazio a `openclaw.plugin.json`.
- Mantenha `name` legível para humanos e mantenha `id` como o id de máquina estável.
- Consulte [Manifesto do Plugin](/pt-BR/plugins/manifest).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-fields

O manifesto do Plugin tem campos de nível superior que o OpenClaw não aceita.

- Compare cada campo de nível superior com a
  [referência de campos do manifesto](/pt-BR/plugins/manifest#top-level-field-reference).
- Remova campos personalizados de `openclaw.plugin.json`.
- Mova metadados de pacote ou instalação para campos compatíveis de `package.json#openclaw`
  em vez do manifesto.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### manifest-unknown-contracts

O manifesto declara chaves não compatíveis dentro de `contracts`.

- Compare cada chave em `contracts` com a
  [referência de contratos](/pt-BR/plugins/manifest#contracts-reference).
- Remova chaves de contrato não compatíveis.
- Mova o comportamento de runtime para o código de registro do Plugin e mantenha `contracts`
  limitado a metadados estáticos de propriedade de capacidade.
- Execute novamente `clawhub package validate <path-to-plugin>`.

## SDK e migração de compatibilidade

### legacy-root-sdk-import

O Plugin importa a partir do barrel raiz obsoleto do SDK:
`openclaw/plugin-sdk`.

- Substitua importações do barrel raiz por importações focadas de subcaminhos públicos.
- Use `openclaw/plugin-sdk/plugin-entry` para `definePluginEntry`.
- Use `openclaw/plugin-sdk/channel-core` para auxiliares de entrada de canal.
- Use [Convenções de importação](/pt-BR/plugins/building-plugins#import-conventions) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths) para encontrar a importação restrita.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### reserved-sdk-import

O Plugin importa um caminho do SDK reservado para Plugins empacotados ou compatibilidade
interna.

- Substitua importações reservadas do SDK interno do OpenClaw por subcaminhos públicos
  `openclaw/plugin-sdk/*` documentados.
- Se o comportamento não tiver SDK público, mantenha o auxiliar dentro do seu pacote ou
  solicite uma API pública do OpenClaw.
- Use [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths) e
  [Migração do SDK](/pt-BR/plugins/sdk-migration) para escolher uma importação compatível.
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-load-session-store

O Plugin ainda usa o auxiliar obsoleto de armazenamento de sessão completo
`loadSessionStore`.

- Use `getSessionEntry(...)` ou `listSessionEntries(...)` ao ler estado de sessão.
- Use `patchSessionEntry(...)` ou `upsertSessionEntry(...)` ao gravar estado de sessão.
- Evite carregar, modificar e salvar o objeto inteiro de armazenamento de sessão.
- Mantenha `loadSessionStore(...)` somente enquanto sua faixa de compatibilidade declarada
  ainda aceitar versões antigas do OpenClaw que exigem isso.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-store-write

O Plugin ainda usa um auxiliar obsoleto de gravação de armazenamento de sessão completo, como
`saveSessionStore` ou `updateSessionStore`.

- Use `patchSessionEntry(...)` ao atualizar campos em uma entrada de sessão existente.
- Use `upsertSessionEntry(...)` ao substituir ou criar uma entrada de sessão.
- Evite carregar, modificar e salvar o objeto inteiro de armazenamento de sessão.
- Mantenha auxiliares de gravação de armazenamento completo somente enquanto sua faixa de compatibilidade declarada
  ainda aceitar versões antigas do OpenClaw que os exigem.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-file-helper

O Plugin ainda usa auxiliares obsoletos de caminho de arquivo de sessão, como
`resolveSessionFilePath` ou `resolveAndPersistSessionFile`.

- Use `getSessionEntry(...)` para ler metadados de sessão por agente e identidade
  de sessão.
- Use `patchSessionEntry(...)` ou `upsertSessionEntry(...)` para persistir metadados de sessão.
- Use identidade de transcrição ou auxiliares de destino quando o código estiver preparando uma
  operação de transcrição.
- Não persista nem dependa de caminhos de arquivo de transcrição legados.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-file-target

O Plugin ainda usa o auxiliar obsoleto de destino de arquivo de transcrição
`resolveSessionTranscriptLegacyFileTarget`.

- Use `resolveSessionTranscriptIdentity(...)` quando o código precisar apenas da identidade pública
  da sessão.
- Use `resolveSessionTranscriptTarget(...)` quando o código precisar de um destino estruturado
  de operação de transcrição.
- Evite ler ou construir destinos de arquivo de transcrição legados diretamente.
- Mantenha o auxiliar legado somente enquanto sua faixa de compatibilidade declarada ainda
  aceitar versões antigas do OpenClaw que o exigem.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### sdk-session-transcript-low-level

O Plugin ainda usa auxiliares obsoletos de baixo nível para transcrição, como
`appendSessionTranscriptMessage` ou `emitSessionTranscriptUpdate`.

- Use `appendSessionTranscriptMessageByIdentity(...)` para acréscimos de transcrição.
- Use `publishSessionTranscriptUpdateByIdentity(...)` para notificações de atualização
  de transcrição.
- Prefira a superfície estruturada de runtime de transcrição para que o OpenClaw possa aplicar os
  limites de transação e o tratamento de identidade corretos.
- Mantenha auxiliares de transcrição de baixo nível somente enquanto sua faixa de compatibilidade declarada
  ainda aceitar versões antigas do OpenClaw que os exigem.
- Consulte [API de runtime](/pt-BR/plugins/sdk-runtime#agent-session-state) e
  [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### legacy-before-agent-start

O Plugin ainda usa o hook legado `before_agent_start`.

- Mova trabalho de substituição de modelo ou provedor para `before_model_resolve`.
- Mova trabalho de modificação de prompt ou contexto para `before_prompt_build`.
- Mantenha `before_agent_start` somente enquanto sua faixa de compatibilidade declarada ainda
  aceitar versões antigas do OpenClaw que o exigem.
- Consulte [Hooks](/pt-BR/plugins/hooks) e
  [Compatibilidade de Plugin](/pt-BR/plugins/compatibility).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### provider-auth-env-vars

O manifesto ainda usa metadados legados de autenticação de provedor `providerAuthEnvVars`.

- Espelhe metadados de variáveis de ambiente do provedor em `setup.providers[].envVars`.
- Mantenha `providerAuthEnvVars` somente como metadados de compatibilidade enquanto sua faixa
  aceita do OpenClaw ainda precisar disso.
- Consulte [referência de setup](/pt-BR/plugins/manifest#setup-reference) e
  [Migração do SDK](/pt-BR/plugins/sdk-migration).
- Execute novamente `clawhub package validate <path-to-plugin>`.

### channel-env-vars

O manifesto usa metadados legados ou antigos de variáveis de ambiente de canal sem os metadados
atuais de setup ou configuração que o ClawHub espera.

- Mantenha os metadados de variáveis de ambiente de canal declarativos para que o OpenClaw possa inspecionar o status de setup
  sem carregar o runtime do canal.
- Espelhe o setup de canal orientado por variáveis de ambiente nos metadados atuais de setup, configuração de canal ou
  metadados de canal do pacote usados pelo formato do seu Plugin.
- Mantenha `channelEnvVars` somente como metadados de compatibilidade enquanto versões antigas aceitas
  do OpenClaw ainda o exigirem.
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

O pacote distribui um arquivo de manifesto de segurança não compatível.

- Remova `openclaw.security.json` até que o OpenClaw documente um esquema versionado de manifesto de segurança
  e o comportamento do ClawHub.
- Mantenha comportamento sensível à segurança documentado na documentação pública do seu pacote ou
  no README até que o contrato de manifesto exista.
- Execute novamente `clawhub package validate <path-to-plugin>`.

## Relacionados

- [CLI do ClawHub](/pt-BR/clawhub/cli)
- [Publicação no ClawHub](/pt-BR/clawhub/publishing)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
- [Manifesto do Plugin](/pt-BR/plugins/manifest)
- [Pontos de entrada de Plugin](/pt-BR/plugins/sdk-entrypoints)
- [Compatibilidade de Plugin](/pt-BR/plugins/compatibility)

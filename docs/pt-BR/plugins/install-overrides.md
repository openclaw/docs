---
read_when:
    - Testando fluxos de integração ou configuração com um Plugin empacotado localmente
    - Verificando um pacote de Plugin antes de publicá-lo
    - Substituindo uma instalação automática de plugin por um artefato de teste
sidebarTitle: Install overrides
summary: Teste substituições de plugins empacotados com fluxos de instalação no momento da configuração
title: Substituições de instalação de Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

As substituições de instalação de plugins permitem que mantenedores testem instalações de plugins durante a configuração contra
um pacote npm específico ou um tarball local gerado por npm-pack. Elas são apenas para validação
E2E e de pacote. Usuários comuns devem instalar plugins com
[`openclaw plugins install`](/pt-BR/cli/plugins).

<Warning>
As substituições executam código de plugin a partir da origem que você fornece. Use-as apenas em um
diretório de estado isolado ou em uma máquina de teste descartável.
</Warning>

## Ambiente

As substituições ficam desabilitadas a menos que ambas as variáveis estejam definidas:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

O mapa de substituições é JSON indexado por id de plugin. Os valores aceitam:

- `npm:<registry-spec>` para pacotes de registro e versões ou tags exatas
- `npm-pack:<path.tgz>` para tarballs locais produzidos por `npm pack`

Caminhos relativos `npm-pack:` são resolvidos a partir do diretório de trabalho atual.

## Comportamento

Quando um fluxo durante a configuração pede para instalar um plugin cujo id aparece no mapa,
o OpenClaw usa a origem de substituição em vez da origem npm do catálogo, empacotada ou padrão.
Isso se aplica ao onboarding e a outros fluxos que usam o instalador compartilhado de plugins
durante a configuração.

As substituições ainda exigem o id de plugin esperado. Um tarball mapeado para `codex`
deve instalar um plugin cujo id de manifesto seja `codex`.

As substituições não herdam o status oficial de origem confiável. Mesmo quando a entrada do catálogo
normalmente representa um pacote pertencente ao OpenClaw, uma substituição é tratada como
entrada de teste fornecida pelo operador.

Arquivos `.env` do workspace não podem habilitar substituições de instalação. Defina essas variáveis no
shell confiável, no job de CI ou no comando de teste remoto que inicia o OpenClaw.

## E2E de pacote

Use um diretório de estado isolado para que instalações de pacote e registros de instalação não
toquem no seu estado normal do OpenClaw:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Verifique o pacote instalado sob o diretório de estado:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

Para E2E de provedor ao vivo, carregue a chave de API real a partir de um shell confiável ou segredo de CI
antes de iniciar o comando de teste. Não imprima chaves; relate apenas a origem e
se a chave estava presente.

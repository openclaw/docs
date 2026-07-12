---
x-i18n:
    generated_at: "2026-07-12T14:51:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8712b1aeb2e605055c22cf308049e5e74fdf33061870026be20bd55cb0c3d1d
    source_path: AGENTS.md
    workflow: 16
---

# Guia de documentação

Este diretório abrange a criação da documentação, as regras de links do Mintlify e a política de internacionalização da documentação.

## Regras do Mintlify

- A documentação é hospedada no Mintlify (`https://docs.openclaw.ai`).
- Os links internos da documentação em `docs/**/*.md` devem permanecer relativos à raiz, sem o sufixo `.md` ou `.mdx` (exemplo: `[Config](/gateway/configuration)`).
- As referências cruzadas de seções devem usar âncoras em caminhos relativos à raiz (exemplo: `[Hooks](/gateway/configuration-reference#hooks)`).
- Os títulos da documentação devem evitar travessões e apóstrofos, pois a geração de âncoras do Mintlify é frágil nesses casos.
- O README e outros documentos renderizados pelo GitHub devem manter URLs absolutas da documentação para que os links funcionem fora do Mintlify.
- O conteúdo da documentação deve permanecer genérico: sem nomes de dispositivos pessoais, nomes de host ou caminhos locais; use placeholders como `user@gateway-host`.

## Regras de conteúdo da documentação

- Para documentação, textos da interface e listas de seleção, ordene os serviços/provedores alfabeticamente, a menos que a seção descreva explicitamente a ordem de execução ou a ordem de detecção automática.
- Mantenha a nomenclatura dos plugins incluídos consistente com as regras de terminologia de plugins aplicadas em todo o repositório no `AGENTS.md` raiz.
- Documentação gerada, nunca edite manualmente: `docs/plugins/reference/**`, `docs/plugins/reference.md` e `docs/plugins/plugin-inventory.md` são gerados por `pnpm plugins:inventory:gen`; `docs/docs_map.md`, por `pnpm docs:map:gen`; `docs/maturity/**`, por `pnpm maturity:render`.

## Documentação interna

- A documentação privada e de longa duração para operadores deve ficar em `~/Projects/manager/docs/`.
- A documentação interna de rascunho/espelho local do repositório pode ficar em `docs/internal/`, que é ignorado.
- Nunca adicione páginas de `docs/internal/**` à navegação de `docs/docs.json` nem crie links para elas na documentação pública.
- `scripts/docs-sync-publish.mjs` exclui e remove `docs/internal/**` do repositório público de publicação `openclaw/docs` caso uma página seja adicionada à força posteriormente.
- A documentação interna pode mencionar caminhos do repositório, nomes de aplicativos privados, nomes de itens do 1Password e runbooks, mas nunca deve incluir valores secretos.

## Edição do quadro de maturidade

`taxonomy.yaml` e `qa/maturity-scores.yaml` são as entradas de origem; a documentação de maturidade gerada em `docs/maturity/` consiste em projeções e não deve ser editada manualmente em relação a pontuação, LTS, taxonomia, perfil de QA ou tabelas de evidências.
`scripts/qa/render-maturity-docs.ts` é responsável pela geração; use `pnpm maturity:render` para atualizar a documentação versionada e `pnpm maturity:check` para verificá-la.
`.github/workflows/maturity-scorecard.yml` renderiza prévias dos artefatos e pode abrir PRs de documentação gerada; `.github/workflows/openclaw-release-checks.yml` o aciona para o QA de lançamento.
Mantenha os dados determinísticos de `qa-evidence.json.scorecard` nos artefatos do GitHub Actions, a menos que um mantenedor solicite explicitamente uma projeção sanitizada e versionada.
As substituições manuais devem alterar o estado de origem em um PR e explicar o motivo, além de fornecer evidências públicas ou anonimizadas.

## Internacionalização da documentação

- A documentação em outros idiomas não é mantida neste repositório. A saída de publicação gerada fica no repositório separado `openclaw/docs` (geralmente clonado localmente como `../openclaw-docs`).
- Não adicione nem edite documentação localizada em `docs/<locale>/**` aqui.
- Considere a documentação em inglês deste repositório e os arquivos de glossário como a fonte da verdade.
- Pipeline: atualize aqui a documentação em inglês, atualize `docs/.i18n/glossary.<locale>.json` conforme necessário e, em seguida, permita que a sincronização do repositório de publicação e `scripts/docs-i18n` sejam executados em `openclaw/docs`.
- Antes de executar novamente `scripts/docs-i18n`, adicione entradas ao glossário para quaisquer novos termos técnicos, títulos de páginas ou rótulos curtos de navegação que devam permanecer em inglês ou usar uma tradução fixa.
- `pnpm docs:check-i18n-glossary` é a verificação para títulos alterados da documentação em inglês e rótulos curtos da documentação interna.
- A memória de tradução fica nos arquivos gerados `docs/.i18n/*.tm.jsonl` no repositório de publicação.
- Consulte `docs/.i18n/README.md`.

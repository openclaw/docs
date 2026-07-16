---
read_when:
    - Falla la CLI de ClawHub o los comandos del registro de OpenClaw
    - No se puede instalar, publicar ni actualizar un paquete
summary: Solución de problemas de inicio de sesión, instalación, publicación, actualización y API de ClawHub.
x-i18n:
    generated_at: "2026-07-16T11:27:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Solución de problemas

## `clawhub login` abre un navegador, pero nunca finaliza

La CLI inicia un servidor local de devolución de llamada de corta duración durante el inicio de sesión mediante el navegador.

- Asegúrese de que el navegador pueda acceder a `http://127.0.0.1:<port>/callback`.
- Compruebe las reglas del firewall local, la VPN y el proxy si la devolución de llamada nunca llega.
- En entornos sin interfaz gráfica, cree un token de API en la interfaz web de ClawHub y ejecute:

```bash
clawhub login --token clh_...
```

## `whoami` o `publish` devuelve `Unauthorized` (401)

- Vuelva a iniciar sesión con `clawhub login`.
- Si utiliza una ruta de configuración personalizada, confirme que `CLAWHUB_CONFIG_PATH` apunte al
  archivo que contiene su token actual.
- Si utiliza un token de API, confirme que no se haya revocado en la interfaz web.

## La búsqueda o instalación devuelve `Rate limit exceeded` (429)

Consulte la información de reintento en la respuesta:

- `Retry-After`: segundos que se deben esperar antes de volver a intentarlo.
- `RateLimit-Limit`: el límite aplicado a esta solicitud.
- `RateLimit-Remaining`: su presupuesto restante exacto cuando el encabezado está presente. En `429`, es `0`.
- `RateLimit-Reset` o `X-RateLimit-Reset`: momento del restablecimiento.

Si muchos usuarios comparten una misma IP de salida, se pueden alcanzar los límites de IP anónima aunque cada
persona solo envíe unas pocas solicitudes. Inicie sesión cuando sea posible y vuelva a intentarlo después de la
demora indicada.

## La búsqueda o instalación falla detrás de un proxy

La CLI respeta las variables de proxy estándar:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Los nombres admitidos incluyen `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` y
`http_proxy`.

## Una Skill no aparece en la búsqueda

- Compruebe el slug exacto o la página del propietario si los conoce.
- Confirme que la versión sea pública y no esté retenida por el análisis o la moderación.
- Si es el propietario de la Skill, inicie sesión e inspecciónela:

```bash
clawhub inspect @openclaw/demo
```

Los diagnósticos visibles para el propietario pueden explicar el estado del análisis, el control de carga o la moderación.

## La publicación falla porque faltan metadatos obligatorios

Para las Skills, compruebe el frontmatter de `SKILL.md`. Las variables de entorno y
herramientas obligatorias deben declararse para que los usuarios y los analizadores puedan comprender el paquete.

Para los plugins, compruebe los metadatos de compatibilidad de `package.json`. Las publicaciones
de plugins de código necesitan campos de compatibilidad con OpenClaw, como `openclaw.compat.pluginApi` y
`openclaw.build.openclawVersion`.

Previsualice primero la carga útil de publicación:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## La publicación falla debido a un error del propietario o de la fuente de GitHub

ClawHub utiliza la identidad de GitHub y la atribución de la fuente para vincular los paquetes con sus
publicadores.

- Asegúrese de haber iniciado sesión con la cuenta de GitHub que posee el paquete o puede
  publicarlo.
- Compruebe que la URL de la fuente sea pública o accesible para ClawHub.
- Para fuentes de GitHub, utilice `owner/repo`, `owner/repo@ref` o una URL completa de GitHub.

## La publicación falla porque un espacio de nombres está reclamado o reservado

Si una publicación falla porque el identificador del propietario, el espacio de nombres de la organización, el ámbito del paquete, el slug de la Skill
o el nombre del paquete ya están reclamados o reservados, confirme primero que está
publicando con el propietario que coincide con el espacio de nombres. En el caso de paquetes de plugins,
los nombres con ámbito como `@example-org/example-plugin` deben publicarse con el
propietario `example-org` correspondiente.

Si considera que su organización, proyecto o marca es el propietario legítimo del espacio de nombres, pero
no puede administrar el propietario actual de ClawHub, abra una
[incidencia de reclamación de organización o espacio de nombres](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
con pruebas públicas que no sean confidenciales. Consulte
[Reclamaciones de organizaciones y espacios de nombres](/clawhub/namespace-claims) para obtener orientación sobre las pruebas y saber qué
no debe incluirse en incidencias públicas.

## `sync` indica que no se encontraron Skills

`sync` busca carpetas que contengan `SKILL.md` o `skill.md`.

Indique las raíces que desea analizar:

```bash
clawhub sync --root /path/to/skills
```

Previsualice primero si no sabe con certeza qué se publicará:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` rechaza la operación debido a cambios locales

Los archivos locales no coinciden con ninguna versión conocida por ClawHub. Elija una opción:

- Conserve las modificaciones locales y omita la actualización.
- Sobrescriba con la versión publicada:

```bash
clawhub update @openclaw/demo --force
```

- Publique la copia modificada con un nuevo slug o como bifurcación.

## La instalación de un plugin falla en OpenClaw

- Utilice una fuente explícita de ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

- Compruebe en la página de detalles del paquete el estado del análisis y los metadatos de compatibilidad.
- Confirme que su versión de OpenClaw satisfaga el intervalo de compatibilidad
  anunciado por el paquete.
- Si el paquete está oculto, retenido o bloqueado, es posible que no pueda instalarse hasta que
  el propietario resuelva el problema.

## Las solicitudes a la API pública fallan

- Respete los encabezados de reintento `429` y almacene en caché las respuestas públicas de listado y búsqueda.
- Remita a los usuarios al listado canónico de ClawHub.
- No replique contenido oculto, privado, retenido o bloqueado por moderación fuera de la
  superficie de la API pública.

Consulte [API HTTP](/clawhub/http-api) para obtener información detallada sobre los endpoints.

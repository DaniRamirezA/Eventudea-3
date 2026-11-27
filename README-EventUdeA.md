# EventUdeA

Aplicación local recuperada del archivo `.make` adjunto, conservando su identidad verde, tipografías, navegación, tarjetas, formularios y pantallas institucionales.

## Ejecución

- `pnpm dev`: Next.js 15 App Router.
- `pnpm build`: exportación estática Next.js en `out/`, sin backend ni rutas API.
- `pnpm dev:preview` / `pnpm build:preview`: adaptador Vite para la vista previa de Make; monta exactamente la misma aplicación.
- `pnpm verify`: pruebas automatizadas, TypeScript, compilación Next.js y compilación de la vista previa.

## Cuentas de prueba

Contraseña compartida de prueba: `EventUdeA2026!`

| Perfil | Correo |
|---|---|
| Asistente | asistente@udea.edu.co |
| Organizador | organizador@udea.edu.co |
| Administrador | admin@udea.edu.co |
| Segundo organizador para probar aislamiento | sofia@udea.edu.co |

El registro público crea asistentes; el administrador asigna otros roles. La pantalla de acceso prellena cuentas, pero siempre valida el correo, la contraseña y el estado.

## Arquitectura

- `src/app`: rutas App Router estáticas.
- `src/views`: vistas modulares; `src/components`: controles reutilizables y componentes originales, más botón shadcn/ui.
- `src/contexts` y `src/hooks`: estado, sesión y navegación con historial del navegador.
- `src/services`: autenticación, reglas de negocio puras, PDF y CSV.
- `src/repositories`: contrato de persistencia, adaptador local y datos relacionados.
- `src/types` y `src/validations`: contratos TypeScript y esquemas Zod.
- `tests`: recorridos de negocio y persistencia.

Para conectar una API REST, sustituir `EventRepository`, trasladar autenticación y `execute` al servidor y mantener los contratos. El servidor deberá autorizar también todas las lecturas y escrituras. El repositorio local mantiene una instantánea versionada en `eventudea.database.v1`; la sesión se conserva en `eventudea.session.v1`. Los cambios se sincronizan entre pestañas mediante `storage`. No hay sincronización entre dispositivos ni garantía transaccional para escrituras simultáneas de pestañas: se requiere un backend para ello.

## Reglas y demostración

1. Asistente: crear cuenta o iniciar sesión, explorar y filtrar eventos publicados, abrir un detalle, inscribirse, ver el QR y cancelar desde Mis inscripciones. Historial conserva cancelaciones y eventos pasados.
2. Organizador: crear borrador o enviar solicitud; cambiar al administrador para aprobar o rechazar con motivo. Volver al organizador para consultar observaciones, editar, consultar inscritos y copiar sus códigos. Pegarlos en Validar QR, indicando el porcentaje de asistencia verificado. Se rechazan códigos desconocidos, cancelados, duplicados y de otro organizador.
3. Administrador: revisar solicitudes, modificar roles/estados, gestionar categorías y sedes/espacios con capacidades; consultar eventos, inscripciones y certificados.
4. El certificado se habilita al haber terminado el evento y superar su porcentaje mínimo de asistencia (80% por defecto). El evento histórico de muestra ya tiene un certificado descargable para Ana. Los PDF son documentos de prueba sin firma ni validez institucional.
5. Reportes y listados exportan CSV real, escapando fórmulas. QR representa un código individual real; el ingreso se hace manualmente o con lector externo, sin simulación de cámara.

Las fechas de muestra son relativas al día de inicialización. Hay eventos publicados, pendientes, borradores, rechazados y finalizados. Los cupos y estadísticas se derivan de las inscripciones, no de números ficticios.

## Límites de esta etapa

La autenticación y la protección de rutas son **locales de prueba**, no seguridad de producción. Aunque las contraseñas se guardan como SHA-256 y no como texto, cualquier persona con acceso a las herramientas del navegador puede alterar la base y la sesión. No usar contraseñas personales ni datos sensibles. No hay envío de correo, lectura automática de cámara, firmas de certificados, backend o infraestructura externa.

Para reiniciar voluntariamente la demostración, borrar las dos claves `eventudea.*.v1` en el almacenamiento del navegador y recargar. No se sobrescriben datos corruptos automáticamente.

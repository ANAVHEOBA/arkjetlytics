import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";

export default function NotFound() {
  return (
    <main class="not-found-page">
      <Title>Not Found | Arkjetlytics</Title>
      <HttpStatusCode code={404} />
      <span>404</span>
      <h1>That report does not exist.</h1>
      <p>The requested analytics route could not be found.</p>
      <a href="/">Return to overview</a>
    </main>
  );
}

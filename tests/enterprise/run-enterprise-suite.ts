/**
 * SupplyX Enterprise Suite Runner
 */
import { runEnterpriseReadinessSuite } from './run-enterprise-readiness-suite.js';

runEnterpriseReadinessSuite().then(res => {
  if (res.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});

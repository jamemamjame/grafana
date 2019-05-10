import WhitefalconDatasource from './datasource';
import { WhitefalconQueryCtrl } from './query_ctrl';
import { WhitefalconConfigCtrl } from './config_ctrl';

class WhitefalconAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
}

export {
  WhitefalconDatasource as Datasource,
  WhitefalconQueryCtrl as QueryCtrl,
  WhitefalconConfigCtrl as ConfigCtrl,
  WhitefalconAnnotationsQueryCtrl as AnnotationsQueryCtrl,
};

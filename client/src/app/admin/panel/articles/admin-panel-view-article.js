import React from 'react';
import _ from 'lodash';
import {connect}  from 'react-redux';
import {browserHistory} from 'react-router';
import RichTextEditor from 'react-rte-browserify';

import ArticlesActions from 'actions/articles-actions';
import SessionStore from 'lib-app/session-store';
import i18n from 'lib-app/i18n';
import API from 'lib-app/api-call';
import DateTransformer from 'lib-core/date-transformer';

import AreYouSure from 'app-components/are-you-sure';
import Header from 'core-components/header';
import Loading from 'core-components/loading';
import Button from 'core-components/button';
import Form from 'core-components/form';
import FormField from 'core-components/form-field';
import SubmitButton from 'core-components/submit-button';

class AdminPanelViewArticle extends React.Component {

    static propTypes = {
        topics: React.PropTypes.array,
        loading: React.PropTypes.bool
    };

    static defaultProps = {
        topics: [],
        loading: true
    };

    state = {
        editable: false
    };

    componentDidMount() {
        if(SessionStore.getItem('topics')) {
            this.props.dispatch(ArticlesActions.initArticles());
        } else {
            this.props.dispatch(ArticlesActions.retrieveArticles());
        }
    }

    render() {
        return (
            <div className="admin-panel-view-article">
                {(this.props.loading) ? <Loading /> : this.renderContent()}
            </div>
        );
    }

    renderContent() {
        let article = this.findArticle();

        return (article) ? this.renderArticle(article) : i18n('ARTICLE_NOT_FOUND');
    }

    renderArticle(article) {
        return (this.state.editable) ? this.renderArticleEdit(article) : this.renderArticlePreview(article);
    }

    renderArticlePreview(article) {
        return (
            <div className="admin-panel-view-article__content">
                <div className="admin-panel-view-article__edit-buttons">
                    <Button className="admin-panel-view-article__edit-button" size="medium" onClick={this.onEditClick.bind(this, article)} type="tertiary">
                        {i18n('EDIT')}
                    </Button>
                    <Button size="medium" onClick={this.onDeleteClick.bind(this, article)}>
                        {i18n('DELETE')}
                    </Button>
                </div>
                <div className="admin-panel-view-article__article">
                    <Header title={article.title}/>

                    <div className="admin-panel-view-article__article-content">
                        <div dangerouslySetInnerHTML={{__html: article.content}}/>
                    </div>
                    <div className="admin-panel-view-article__last-edited">
                        {i18n('LAST_EDITED_IN', {date: DateTransformer.transformToString(article.lastEdited)})}
                    </div>
                </div>
            </div>
        );
    }

    renderArticleEdit() {
        return (
            <Form values={this.state.form} onChange={(form) => this.setState({form})} onSubmit={this.onFormSubmit.bind(this)}>
                <div className="admin-panel-view-article__buttons">
                    <SubmitButton className="admin-panel-view-article__button" type="secondary" size="medium">{i18n('SAVE')}</SubmitButton>
                    <Button className="admin-panel-view-article__button" size="medium" onClick={this.onFormCancel.bind(this)}>
                        {i18n('CANCEL')}
                    </Button>
                </div>
                <FormField name="title" label={i18n('TITLE')} />
                <FormField name="content" label={i18n('CONTENT')} field="textarea" />
            </Form>
        );
    }

    findArticle() {
        let article = null;

        _.forEach(this.props.topics, (topic) => {
            if(!article) {
                article = _.find(topic.articles, {id: this.props.params.articleId});
            }
        });

        return article;
    }

    onEditClick(article) {
        this.setState({
            editable: true,
            form: {
                title: article.title,
                content: RichTextEditor.createValueFromString(article.content, 'html')
            }
        });
    }

    onDeleteClick(article) {
        AreYouSure.openModal(i18n('DELETE_ARTICLE_DESCRIPTION'), this.onArticleDeleted.bind(this, article));
    }

    onFormSubmit(form) {
        API.call({
            path: '/article/edit',
            data: {
                articleId: this.findArticle().id,
                title: form.title,
                content: form.content
            }
        }).then(() => {
            this.props.dispatch(ArticlesActions.retrieveArticles());
            this.setState({
                editable: false
            });
        });
    }

    onFormCancel(event) {
        event.preventDefault();

        this.setState({
            editable: false
        });
    }

    onArticleDeleted(article) {
        API.call({
            path: '/article/delete',
            data: {
                articleId: article.id
            }
        }).then(() => browserHistory.push('/admin/panel/articles/list-articles'));
    }
}

export default connect((store) => {
    return {
        topics: store.articles.topics,
        loading: store.articles.loading
    };
})(AdminPanelViewArticle);

"use strict"
import React from 'react'
import Transmit from 'react-transmit'
import request from '../utils/request'
import './Category.css'
import './lexicon.css'
import {Link} from 'react-router'
import classNames from 'classnames'
import categoryData from './data/Category'
import Posts from '../Posts/Posts.jsx'

class Issue extends React.Component {
    render() {
        var {title, content, post_count, clickHandler} = this.props;

        return (
        <div className="issue_item"
             onClick={clickHandler}>
            <div className="issue_item_title">
                <span className="prompt"></span>
                <span className="q_text" dangerouslySetInnerHTML={{ __html: title }} />
                <span className="Issue-titleIcon"><i className="fa fa-comments-o"></i></span>
                <span className="issue_item_discuss_count">{post_count || ''}</span>
            </div>
            <div className="q_text" dangerouslySetInnerHTML={{ __html: content }} />
        </div>);
    }
}

class Category extends React.Component {
    static contextTypes = { router: React.PropTypes.func }

    constructor (props) { super(props)
        this.state = {
            showDiscussion: !!this.props.params.postID,
            showFullDiscussion: false
        }
    }

    _toggleShowDiscussion (postID, event){
        window.scrollTo(500, 0)

        if(postID) {
            this.props.setQueryParams({
                postID: postID
            })
        }

        this.setState({
            showDiscussion: !this.state.showDiscussion,
            showFullDiscussion: false
        });
    }

    _toggleShowDiscussionWeb (postID, event){
        window.scrollTo(500, 0);

        var discussion = document.getElementsByClassName("Category-discussion");
        discussion.scrollTop = 0;

        if(postID){
            this.props.setQueryParams({
                postID: postID
            })
        }

        if(!this.state.showDiscussion){
            this.setState({
                showDiscussion: true
            });
        }
        this.setState({
            showFullDiscussion: false
        });
    }

    _hideDiscussion(){
        this.setState({
            showDiscussion: false
        });
    }

    _toggleShowFullDiscussion(){
        this.setState({
            showFullDiscussion: !this.state.showFullDiscussion
        })
    }

    componentWillMount() {
        const {proposalName, category, postID} = this.props.params
        const metaData = categoryData[proposalName][category]

        this.props.setQueryParams({
            gitbookURL: metaData.gitbook_url,
            categoryNum: metaData.category_num,
            postID: postID
        })
    }
    componentWillReceiveProps(nextProps) {
        const {proposalName, category, postID, page} = this.props.params;
        const nextProposalName = nextProps.params.proposalName;
        const nextCategory = nextProps.params.category;
        const nextPage = nextProps.params.page;

        if (nextProps.gitbook.length) {
            const {topic_list} = nextProps.talk || {};
            const {proposal_cht, category_cht} = categoryData[proposalName][category]
            const icon = category.replace(/\d+$/, '') + '.png'
            const base = `/${proposalName}/`
            this.props.setNavList([
                { path: base, label: proposal_cht, type: 'title' },
            ].concat(nextProps.gitbook.map(({title, children}, pageID)=>
                (pageID === 0) ? [{
                    icon,
                    path: `${base}${category}/`,
                    label: category_cht,
                    type: 'sub',
                }] : [{
                    path: `${base}${category}/${pageID}/`,
                    label: title.replace(/<[^>]*>/g, ''),
                    type: 'section',
                }].concat( (topic_list && topic_list.topics) ? children.map((c)=>{
                    const label = c.title.replace(/<[^>]*>/g, '')
                    const {id} = topic_list.topics.filter(
                        ({fancy_title})=>fancy_title === label
                    )[0] || {}
                    let path = `${base}${category}/${pageID}/`
                    if (id) { path += (id + '/') }
                    return { path, label, type: 'sub' } }) : []
                )
            ).reduce((a, b)=>a.concat(b))))
        }

        if (!proposalName || !nextProposalName) { return }
        if ((proposalName === nextProposalName) &&
            (category === nextCategory) &&
            (page === nextPage) ){ return }

        //When changing page, always hide the discussion
        this.setState({
            showDiscussion: false
        });

        const metaData = categoryData[nextProposalName][nextCategory]
        this.props.setQueryParams({
            gitbookURL: metaData.gitbook_url,
            categoryNum: metaData.category_num,
            postID: postID
        })
    }
    render() {
        const {gitbookURL, categoryNum, gitbook, talk, posts, onChange} = this.props
        const {proposalName, category, postID} = this.props.params
        const page = Number(this.props.params.page) || 0

        if(!gitbook || !gitbook[page]) { return <div/> }

        // Get post_count, topic_id from talk.vtaiwan json
        const titleToPostCount = {}

        if(talk && talk.topics){
            talk.topics.map((value)=>{
                titleToPostCount[value.fancy_title] = {
                    id: value.id,
                    post_count: value.posts_count
                };
            })
        }

        // Add post_count, topic_id data to gitbook data
        const {title, content, children} = gitbook[page]
        if (children){ children.forEach((item)=>{
            if (titleToPostCount[item.title]){
                item.post_count = titleToPostCount[item.title].post_count || 0
                item.id = titleToPostCount[item.title].id
            } else {
                item.post_count = 0
            }
        }) }

        // Used in breadcrumbs
        // 目前的討論主題（遠距教育、群眾募資...等）以及階段（討論、草案、定案...等）
        const {proposal_cht, category_cht} = categoryData[proposalName][category]

        // 某一個討論話題的討論 posts
        const {showDiscussion} = this.state
        const discussionClasses = classNames({
            "Category-discussion": true,
            "is-show": showDiscussion
        })

        const bindToggleFullDiscussion = this._toggleShowFullDiscussion.bind(this, null)
        const showFullDiscussion = this.state.showFullDiscussion
        const loadingImg = require("./images/loading.gif")

        let postsItem = ""
        let loadingItem = <img className="Category-loadingImg" src={loadingImg} />

        if (posts) {
            if (posts.post_stream) {
                postsItem = <Posts
                    data={posts.post_stream.posts}
                    id={posts.id}
                    title={posts.title}
                    handleToggleFullDiscussion={bindToggleFullDiscussion}
                    showFull={showFullDiscussion}
                />
                loadingItem = "";
            } else {
                // loadingItem = "沒有討論";
            }
        }

        const discussionContentMobile = (
            <div className={discussionClasses}>
                <div className="Category-discussionNav">
                    <div className="Category-discussionNavToggle"
                         onClick={this._toggleShowDiscussion.bind(this, null)}>
                        <i className="fa fa-chevron-left" />
                    </div>
                </div>
                {postsItem}
            </div>
        )
        const discussionContentWeb = (
            <div className={discussionClasses}>
                <div className="Category-discussionNavClose"
                     onClick={this._hideDiscussion.bind(this, null)}>
                    <i className="fa fa-remove" />
                </div>
                {postsItem}
                {loadingItem}
            </div>
        );
        const discussionContent = (window.innerWidth > 600)
            ? discussionContentWeb
            : discussionContentMobile

        // 討論話題列表
        // { (children || []).map((props) => <Issue {...props}/>) }
        const issueClickHandler = (window.innerWidth > 600)
            ? this._toggleShowDiscussionWeb
            : this._toggleShowDiscussion

        const issueItems = (children || []).map((props, key) =>
            <Issue {...props}
                clickHandler={issueClickHandler.bind(this, props.id)}
                key={key} />
        )

        const categoryListClasses = classNames({
            "Category-categoryList": true,
            "is-hidden": showDiscussion
        })
        const icon = require(`../NavBar/images/${
            category.replace(/\d+$/, '')
        }.png`)

        return <div className="Category">
            <div className={categoryListClasses}>
                <img className="Category-icon" src={icon} />
                <div className="Category-breadcrumbs">
                    <Link to="proposal"
                        className="Category-breadcrumbsLink"
                        params={{proposalName: proposalName}}>
                            { proposal_cht }
                    </Link>
                    &nbsp;&gt;&nbsp;
                    <Link to="category"
                        className="Category-breadcrumbsLink"
                        params={{proposalName: proposalName, category: category}}>
                            { category_cht }
                    </Link>
                </div>
                <div className="Category-title" dangerouslySetInnerHTML={{__html: title }} />
                <div dangerouslySetInnerHTML={{__html: content }} />
                { issueItems }
                { (page > 1) ?
                     <Link to="categoryPage"
                         params={{ proposalName, category, page: (page - 1) }}
                         className="Category-navigation Category-navigationPre">
                         <i className="fa fa-chevron-left" />
                     </Link>
                : (page === 1) ?
                     <Link to="category"
                         params={{ proposalName, category }}
                         className="Category-navigation Category-navigationPre">
                         <i className="fa fa-chevron-left" />
                     </Link>
                : '' }
                { (page < (gitbook.length - 1)) ?
                     <Link to="categoryPage"
                         params={{ proposalName, category, page: (page + 1) }}
                         className="Category-navigation Category-navigationNext">
                         <i className="fa fa-chevron-right" />
                     </Link>
                : '' }
            </div>
            { discussionContent }
        </div>
    }
}
export default Transmit.createContainer(Category, {
    queries: {
        gitbook({gitbookURL}) {
            if (!gitbookURL) { return new Promise((cb)=>cb([])) }
            return request.get(gitbookURL + "/content.json").then((res) => res).catch(()=>[])
        },
        talk({categoryNum}) {
            if (!categoryNum) { return new Promise((cb)=>cb([])) }
            const result = {}
            const baseURL = `//talk.vtaiwan.tw/c/${categoryNum}-category.json`
            return new Promise((resolve, reject)=>{
                function getJSON(url){
                    request.get(url).then((res)=>{
                        if(!result.topics){
                            result.topics = res.topic_list.topics
                        }else{
                            res.topic_list.topics.forEach((value)=>{
                                result.topics.push(value)
                            })
                        }
                        //if there is next page
                        const more_topics_url = res.topic_list.more_topics_url
                        if(more_topics_url){
                            // [example] /c/crowdfunding-ref1/l/latest?category_id=59&page=1
                            const nextPage = more_topics_url.split("page=")[1]
                            const nextURL = `${baseURL}?page=${nextPage}`
                            if (nextURL === url) { return resolve(result) }
                            return getJSON(nextURL)
                        }else{
                            resolve(result)
                        }
                    })
                }
                getJSON(baseURL)
            })
        },
        posts({postID}){
            if (!postID) { return new Promise((cb)=>cb([])) }
            const result = {};
            const url = `//talk.vtaiwan.tw/t/topic/${postID}.json`
            return new Promise((resolve, reject)=>{
                request.get(url).then((data)=>{
                    if (data.posts_count <= 20) { return resolve(data) }
                    for (let i = 2; i <= parseInt(data.posts_count / 20) + 1; i++) {
                        const nextUrl = `${url}?page=${i}`
                        request.get(nextUrl).then((pageData)=>{
                            data.post_stream.posts = data.post_stream.posts.concat(pageData.post_stream.posts)
                            if (data.post_stream.posts.length >= data.posts_count) {
                                data.post_stream.posts.sort((a, b)=>(+a.id - +b.id))
                                resolve(data)
                            }
                        })
                    }
                })
            })
        }
    }
})

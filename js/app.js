"use strict";


var CURRENT_VERSION = '0.0.1';

var lastClickedObject = null;

var app_id = "org.projectfurnace.memcard";


var PARENTID = 'top-level';


var ACTIONS = {};






/*******************************************************/




var gCurrentDeck = [];
var gCurrentEvaluationTags = [];
var NB_QUESTION_PER_ROUND = 6;
var gCurrentQuestionNb = 0;

var gCardCollection = null;

var gBucketScore = { 0 : 0, 1 : 1, 2 : 2, 3 : 10, 4 : 60, 5 : 300, 6 : 1440, 7 : 7200, 8 : 36000 };



/*******************************************************/





function numberToBase64(n)
{
  var alphabet = "0123456789abcdefghijklmnopqrstuvwxyz-_ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";
  var base = 64;
  while (n > 0)
  {
    var divResult = Math.floor(n / base);
    result += alphabet[n - divResult * base];
    n = divResult;
  }
  return result;
}

function guid() 
{
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  //return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  //return s4() + s4() + '-' + s4() + '-' + s4();
  var n = Math.floor((1 + Math.random()) * 0x100000000);
  return numberToBase64(n) + numberToBase64(Date.now());
}


function toSingleWord(multiWords)
{
  return multiWords.replace(" ", "_");
}



String.format = function() {
  var s = arguments[0];
  for (var i = 0; i < arguments.length - 1; i++) {       
    var reg = new RegExp("\\{" + i + "\\}", "gm");             
    s = s.replace(reg, arguments[i + 1]);
  }

  return s;
}







function childActionItemAsHTML(caption, id, index)
{
	var html = `<li class="table-view-cell media" id="{1}"  data-source="{1}" data-index="{2}">
		    	 	 {0}  
			  </li>`;

	return String.format(html, caption, id, index);
}


function swipedActionItemAsHTML(id, index)
{
	var html = `<li class="table-view-cell btn-on" id="{0}" data-source="{0}" data-index="{2}">
					</span><span class="icon icon-list" data-source="{0}"></span> <span class="icon icon-compose" data-source="{0}"></span><span class="icon icon-share" data-source="{0}"></span><span class="icon icon-trash pull-right" data-source="{0}"></span> {1} 
			  </li>`;

  	//return String.format(html,id, ACTIONS[id].caption, index);
  	return String.format(html,id, '', index);
}



function captionEditAsHTML(caption, id)
{
	var html = `<li id="{1}">
			  	<form>
				  <input type="text" value="{0}" placeholder="Edit caption..." data-source="{1}" id="caption-input">
				</form>
			  </li>`;

	setTimeout(function() { $("#caption-input").unbind().keydown( addOrEditActionItem); }, 50);

	return String.format(html, caption, id);



}

function addActionItemAsHTML()
{
	return captionEditAsHTML("", guid());
}



function saveMenuEntries()
{
	localStorage.setItem(app_id + '.menuentries', JSON.stringify(ACTIONS));
}

function addOrEditActionItem(event)
{
	if ((event.type == 'keydown' && (event.which == 13 || event.which == 9)))
	{
		var caption = $("#caption-input").val();
		var id =  $("#caption-input").attr("data-source");

		coreAddActionItem(caption, id, PARENTID);
		refreshUI(false);
	}

}



function coreAddActionItem(caption, id, parentId)
{
	if (ACTIONS[id] === null || typeof(ACTIONS[id]) === "undefined")
	{
		ACTIONS[id] = {caption: caption, id: id, children: [], checked:false, parent: parentId};
		var parent = ACTIONS[parentId];
		if (parent !== null && typeof(parent) !== "undefined")
		{
			parent.children.push(id);
		}
	}
	else
	{
		coreEditActionItem(caption, id)	
	}

	
	saveMenuEntries();

	
}

function coreEditActionItem(caption, id)
{
	var parent = ACTIONS[id];
	if (parent !== null && typeof(parent) !== "undefined")
	{
		parent.caption = caption;
	}


	saveMenuEntries();
}


function coreDeleteActionItem(id)
{
	var parent = ACTIONS['top-level'];
	if (parent !== null && typeof(parent) !== "undefined")
	{
		var index = parent.children.indexOf(id);
		if (index !== -1)
		{
			parent.children.splice(index, 1);
		}
		delete ACTIONS[id];
	}


	saveMenuEntries();
}

























/******************************** UI INITIALIZATION ****************************/

function refreshUI(bWithAnimation = false)
{
	var html = '';

	if (PARENTID !== 'top-level')
	{
		html += `
		<button class="btn btn-link btn-nav pull-left" data-source="{1}">
		    <span class="icon icon-left-nav" data-source="{1}"></span>
		    Left
		  </button>`;
	}

	html += '<h1 class="title">{0}</h1>';

    $('header.bar').html(String.format(html, ACTIONS[PARENTID].caption, ACTIONS[PARENTID].parent));  

	


	html = '';

	var index = 0;
	for (var i = 0; i < ACTIONS[PARENTID].children.length; i++)
	{
		var action = ACTIONS[ACTIONS[PARENTID].children[i]];

		html += childActionItemAsHTML(action.caption, action.id, index);
		index++;
	
	}

	$('.table-view').html(html);

	if (index === 0)
		$('span.icon-plus').addClass('pulse');
	else
		$('span.icon-plus').removeClass('pulse');


	if (bWithAnimation)
	{
		$('.card').addClass('from-left');
	}
	setTimeout(
		function()
		{ 
			$('.card').removeClass('from-left'); 
			$('li.table-view-cell').on('swipe', swipeEventHandler);
		}
	, 1400);
}

function initUI()
{

	$("body").unbind().click(clickPerformed);
	$( "body" ).bind( "taphold", tapholdEventHandler );


	ACTIONS = JSON.parse(localStorage.getItem(app_id + '.menuentries'));
	if (ACTIONS === null || typeof(ACTIONS) === "undefined")
	{
		ACTIONS = JSON.parse('{"top-level":{"id":"top-level","caption":"HOME","children":["8BXoW62xFhy7m"]},"8BXoW62xFhy7m":{"caption":"Get started (tutorial)","id":"8BXoW62xFhy7m","children":[],"checked":false,"parent":"top-level"}}');
	}

	$("select#nbquestion-combo").change(
		function()
		{
			NB_QUESTION_PER_ROUND = Number($("select#nbquestion-combo").val());
			localStorage.setItem(app_id + ".nbquestion", NB_QUESTION_PER_ROUND.toString());
		}
	);




	refreshUI(true);



	initService();
	
}


function listCardCollection()
{
	$('.slide-groupx').css('transition-duration', '0.4s');
	$('.slide-groupx').css('transform', 'translate3d(-50%, 0px, 0px)');

	var cardCollection = new CardCollection(gCurrentEvaluationTags);
	var cards = cardCollection.getCards(1000, false);

	var html = '<br/><br/><br/><br/><ul class="table-view">';
	for (var i = 0; i < cards.length; i++)
	{
		var card = cards[i];

		var tmp = ` <li class="table-view-cell edit-card" id="{1}"  data-source="{1}" >
							<span class="media-object pull-left icon icon-edit"></span>
		    	 	 		{0}			    
			  		</li>`;

		html += String.format(tmp, card.getCaption(), card.id());
	}

	html += `</ul>
	<div class="content-padded">
	  <span class="icon icon-plus pulse" id="new-card"></span>
	</div>`;


	$('.testbenchcontent').html(html);
}



function swipeEventHandler(evt)
{
	var target = $(evt.target);
    if (target.is('a.navigate-right.ui-link') || target.is('a.navigate-right') || target.is('li.table-view-cell'))
    {
      	var id =  target.attr("data-source");
      	var index =  target.attr("data-index");

      	if ($("#" + id).hasClass('btn-on') === false)
      	{
			$("#" + id).replaceWith(swipedActionItemAsHTML(id, index));
      	}
		else
		{
			var action = ACTIONS[id];

			$("#" + id).replaceWith(childActionItemAsHTML(action.caption, action.id, index));
			
		}
		setTimeout(
			function() {
				$("#" + id).on('swipe', swipeEventHandler);
			}
		,100);
	}
}




function tapholdEventHandler(evt)
{

    var target = $(evt.target);
    if (target.is('a.navigate-right.ui-link') || target.is('a.navigate-right') || target.is('li.table-view-cell'))
    {
      	var id =  target.attr("data-source");
      	var index =  target.attr("data-index");


      	$("#" + id).draggable({axis: "y"}); 
		$("li.table-view-cell").droppable(
			{ drop: function( event, ui ) 
				{
					if (typeof(event) !== "undefined" && event !== null)
					{
						var to = parseInt($(event.target).attr('data-index'));
						var from = parseInt($(event.toElement).attr('data-index'));
						var parentAction = ACTIONS[ACTIONS[id].parent];

						var toInsert = parentAction.children[from];
						parentAction.children.splice(to, 0, toInsert);
						parentAction.children.splice(from + 1, 1);
						saveMenuEntries();
					}

					setTimeout(function() {refreshUI(false);}, 80);
				}
		});
    }
}



function displayTopLevel()
{
	var str = '';
	for(var i = 0; i < ACTIONS['top-level'].children.length; i++)
	{
		str += ACTIONS[ACTIONS['top-level'].children[i]].caption + ',';
	}
	return str;
}











/**************************************************************************/











var CARDS = {};
var TAGS = {};
var PROJECTS = {};




/* ---------------------------------------------------------------- *
 * class Tag
 *
 * summary: This class represents a Tag assigned to a card
 * description: This class represents a Tag assigned to a card.
 *		The purpose of tags is to classify and filter cards
 *
 * ---------------------------------------------------------------- */

class Tag
{
	/* ------------------------------------------------------------- *
	 * method: constructor
	 * ------------------------------------------------------------- */
	constructor(caption)
	{
		this._id = toSingleWord(caption);
		this._caption = caption;
		this._cards = {};

		TAGS[this._id] = this;

	}

	/* ------------------------------------------------------------- *
	 * method: id() returns the id of this tag
	 * ------------------------------------------------------------- */
	id()
	{
		return this._id;
	}

	/* ------------------------------------------------------------- *
	 * method: getCaption() returns the caption for this tag
	 * ------------------------------------------------------------- */
	getCaption()
	{
		return this._caption;
	}

	/* ------------------------------------------------------------- *
	 * method: addToCard() add the tag to the specified card
	 * ------------------------------------------------------------- */
	addToCard(card)
	{
		if (this._cards[card.id()] === null || typeof(this._cards[card.id()]) === "undefined")
		{
			this._cards[card.id()] = card.id();
		}
	}

	/* ------------------------------------------------------------- *
	 * method: removeFromCard() remove the tag from the specified card
	 * ------------------------------------------------------------- */
	removeFromCard(card)
	{
		if (this._cards[card.id()] !== null)
		{
			delete this._cards[card.id()];
		}
	}

	/* ------------------------------------------------------------- *
	 * method: getTaggedCards() returns the list of cards with current tag
	 * ------------------------------------------------------------- */
	 getTaggedCards()
	 {
	 	return Object.keys(this._cards);
	 }

	 /* ------------------------------------------------------------- *
	 * method: getOrCreateTag() returns the tag with the provided caption
	 * ------------------------------------------------------------- */
	 static getOrCreateTag(caption)
	 {
	 	var id = toSingleWord(caption);
	 	var result = TAGS[id];
	 	if (typeof(result) !== "undefined" && (result instanceof Tag))
	 	{
	 		return result;
	 	}
	 	else
	 	{
	 		return new Tag(caption);
	 	}
	 }
}


function saveCards()
{
	localStorage.setItem(app_id + ".cards", JSON.stringify(CARDS));
}


/* ---------------------------------------------------------------- *
 * class Card
 *
 * summary: 
 * recto: 
 *
 * ---------------------------------------------------------------- */

class Card
{
	/* ------------------------------------------------------------- *
	 * method: constructor
	 * ------------------------------------------------------------- */
	constructor(object, recto, verso)
	{
		if(object instanceof Object)
		{
			this._id = object._id;
			this._caption = object._caption;
			this._recto = object._recto;
			this._verso = object._verso;
			this._tags = [];
			this._img = object._img;

			this._score = object._score;
			this._lastEval = object._lastEval;
			this._lastBucketIndex = object._lastBucketIndex;

			for (var i = 0; i < object._tags.length; i++)
			{
				this.addTag(object._tags[i]);
			}
		}
		else
		{
			this._id = guid();
			this._caption = object;
			this._recto = recto;
			this._verso = verso;
			this._tags = [];
			this._img = './img/default.png';
			this.addTag('nice brain');
			this._score = -1;
			this._lastEval = -1;
			this._lastBucketIndex = 1;
		}
		

		CARDS[this._id] = this;

		
		saveCards();

	}


	/* ------------------------------------------------------------- *
	 * method: id() returns the id for the current card
	 * ------------------------------------------------------------- */
	id()
	{
		return this._id;
	}

	/* ------------------------------------------------------------- *
	 * method: getImage() returns the path for the iage for the current card
	 * ------------------------------------------------------------- */
	getImage()
	{
		return this._img;
	}

	

	/* ------------------------------------------------------------- *
	 * method: setImage() sets the iage for this card
	 * ------------------------------------------------------------- */
	setImage(path)
	{
		this._img = path;
		saveCards();
	}


	/* ------------------------------------------------------------- *
	 * method: setScore() sets the score for this card
	 * ------------------------------------------------------------- */
	setScore(score)
	{
		this._score = score;
		saveCards();
	}

	/* ------------------------------------------------------------- *
	 * method: getLastEval() returns last eval for the current card
	 * ------------------------------------------------------------- */
	getLastEval()
	{
		return this._lastEval;
	}

	/* ------------------------------------------------------------- *
	 * method: setLastEval() sets the last eval for this card
	 * ------------------------------------------------------------- */
	setLastEval(lastEval)
	{
		this._lastEval = lastEval;
	}

	/* ------------------------------------------------------------- *
	 * method: getScore() returns score for the current card
	 * ------------------------------------------------------------- */
	getScore()
	{
		return this._score;
	}


	/* ------------------------------------------------------------- *
	 * method: getBucketIndex() returns the bucket index for the current card
	 *         the higher the index, the least frequently asked is the card
	 * ------------------------------------------------------------- */
	getBucketIndex()
	{
		// new card
		if (this._score === gBucketScore[1])
		{
			return 1;
		}
		// 25 day
		else if (this._score >= gBucketScore[8])
		{
			return 8;
		}
		// 5 day
		else if (this._score >= gBucketScore[7])
		{
			return 7;
		}
		// 1 day
		else if (this._score >= gBucketScore[6])
		{
			return 6;
		}
		// 5h
		else if (this._score >= gBucketScore[5])
		{
			return 5;
		}
		//1 hour
		else if (this._score >= gBucketScore[4])
		{
			return 4;
		}
		// 10 min
		else if (this._score >= gBucketScore[3])
		{
			return 3;
		} 
		// 2min
		else if (this._score >= gBucketScore[2])
		{
			return 2;
		}
		// failed card
		else if (0 >= this._score)
		{
			return 0;
		}

		
	}



	rateCard(rating)
	{
		if (rating === "hard")
		{
			this._score = 9;
			this._lastBucketIndex = 2;
		}
		else if (rating === "fail")
		{
			this._score = -10;
			this._lastBucketIndex = 0;
		}
		else
		{
			this._lastBucketIndex = this._lastBucketIndex === 0 ? 2 : (this._lastBucketIndex + 1);
			this._lastBucketIndex = this._lastBucketIndex > 8 ? 8 : this._lastBucketIndex;
			this._score = gBucketScore[this._lastBucketIndex];
			if (rating === 'easy')
			{
				this._score *= 2;
			}
		}

		var newEvalDate =  Math.floor(Date.now() / 60000);
		this._lastEval = newEvalDate;
	}




	/* ------------------------------------------------------------- *
	 * method: caption() returns the caption for the current card
	 * ------------------------------------------------------------- */
	getCaption()
	{
		return this._caption;
	}

	/* ------------------------------------------------------------- *
	 * method: setCaption() sets the caption for this card
	 * ------------------------------------------------------------- */
	setCaption(caption)
	{
		this._caption = caption;
		saveCards();
	}


	/* ------------------------------------------------------------- *
	 * method: getRecto() returns the recto for this card
	 * ------------------------------------------------------------- */
	getRecto()
	{
		return this._recto;
	}

	/* ------------------------------------------------------------- *
	 * method: setRecto() sets the recto for this card
	 * ------------------------------------------------------------- */
	setRecto(recto)
	{
		this._recto = recto;
		saveCards();
	}

	/* ------------------------------------------------------------- *
	 * method: getVerso() returns the verso for this card
	 * ------------------------------------------------------------- */
	getVerso()
	{
		return this._verso;
	}

	/* ------------------------------------------------------------- *
	 * method: setVerso() sets the verso for this card
	 * ------------------------------------------------------------- */
	setVerso(verso)
	{
		this._verso = verso;
		saveCards();
	}


	/* ------------------------------------------------------------- *
	 * method: getTags() returns the tags for this card
	 * ------------------------------------------------------------- */
	getTags()
	{
		return this._tags;
	}

	/* ------------------------------------------------------------- *
	 * method: addTag() add a tag to this card
	 * ------------------------------------------------------------- */
	addTag(caption)
	{
		var tag = Tag.getOrCreateTag(caption);

		if (tag !== null && (tag instanceof Tag))
		{
	
			var i = this._tags.indexOf(caption);
			if (i === -1)
			{
				this._tags.push(caption);
				tag.addToCard(this);
				saveCards();
			}
		}

	}

	/* ------------------------------------------------------------- *
	 * method: removeTag() remove tag from this card
	 * ------------------------------------------------------------- */
	removeTag(caption)
	{
		var tagId = toSingleWord(caption);
		var tag = TAGS[tagId];

		if (tag !== null && (tag instanceof Tag))
		{
			var i = this._tags.indexOf(caption);
			if (i != -1)
			{
				this._tags.splice(i, 1);
			}
			tag.removeFromCard(this);
			saveCards();
		}
	}

	/* ------------------------------------------------------------- *
	 * method: hasTag() returns true if such a tag is found
	 * ------------------------------------------------------------- */
	hasTag(tag)
	{
		if (tag instanceof Tag)
		{
			return this._tags.indexOf(tag.id()) !== -1;
		}
		else if (typeof(tag) === "string")
		{
			return this._tags.indexOf(this._projectId + toSingleWord(tag)) !== -1;
		}
		return false;
	}

}




function cardFiltering(tagIdList)
{
	var counter = {};
	for (var i = 0; i < tagIdList.length; i++)
	{
		var tag = TAGS[tagIdList[i]];
		if (tag !== null && (tag instanceof Tag))
		{
			var cards = tag.getTaggedCards();
			if (i === 0)
			{
				for (var j = 0; j < cards.length; j++)
				{
					counter[cards[j]] = 1;
				}
			}
			else
			{
				for (var j = 0; j < cards.length; j++)
				{
					var currentVal = counter[cards[j]];
					if (typeof(currentVal) === "undefined" || currentVal === null)
						continue;

					counter[cards[j]] = currentVal + 1;
				}
			}
		}
	}

	var result = [];
	var okVal = tagIdList.length;
	var tmp = Object.keys(counter);
	for (var i = 0; i < tmp.length; i++)
	{
		if (counter[tmp[i]] === okVal)
		{
			var card = CARDS[tmp[i]];
			if (card !== null && (card instanceof Card))
			{
				result.push(card);
			}
		}
	}

	for (let i = result.length; i; i--) 
    {
        let j = Math.floor(Math.random() * i);
        [result[i - 1], result[j]] = [result[j], result[i - 1]];
    }

	return result;
}



function compareCards(a, b)
{
	if (b.getBucketIndex() > a.getBucketIndex()) { return -1; }
	if (a.getBucketIndex() > b.getBucketIndex()) { return 1; }

	if (b._lastBucketIndex > a._lastBucketIndex) { return -1; }
	if (a._lastBucketIndex > b._lastBucketIndex) { return 1; }

	return 0;
}


class CardCollection
{
	constructor(tagIdList)
	{
		this._cards = cardFiltering(tagIdList);
	}


	getCards(nbCards, bShuffle = true)
	{
		var result = [];
		this._cards.sort(compareCards);

		for (var i = 0; nbCards > i && this._cards.length > i; i++)
		{
			result.push(this._cards[i]);
		}

		if (bShuffle)
		{
			for (let i = result.length; i; i--) 
		    {
		        let j = Math.floor(Math.random() * i);
		        [result[i - 1], result[j]] = [result[j], result[i - 1]];
		    }
		}

	    return result;
	}


	fetchAverageScore()
	{
		var score = 0;
		for (var i = 0; this._cards.length > i; i++)
		{
			score += this._cards[i]._lastBucketIndex;
		}

		return Math.round(score / this._cards.length);
	}


}



function createITTOCard(type, caption, processCaption, versoList, pageNb)
{
	var typeStr = (type === 'inputs') ? 'inputs' : ((type === 'outputs') ? 'outputs' : 'tools & techniques');
	var q = 'Please provide the **' + typeStr + '** for the **' + processCaption + '** process found in the **' + caption + ' management** knowledge area of the PMBOK (Project Management Body Of Knowledge 6th Edition - p'+ pageNb.toString() +').';
	var answer = '####' + processCaption + '####\n\nThe **' + typeStr + '** for the **' + processCaption + '** process are {0}';


	var l = '\n\n';


	for (var i = 0; i < versoList.length; i++)
	{
		var item = versoList[i];

		if (typeof(item) === 'string')
		{
			l += (i + 1).toString() + '.  **' + versoList[i] + '**\n' ;
		}
		else
		{
			l += (i + 1).toString() + '.  ' + item[0] + '\n' ;
			for (var j = 1; j < item.length; j++)
			{
				l += '   * ' + item[j] + '\n' ;
			}
		}
	}

	var card = new Card(caption + ' management', q, String.format(answer, l));
	card.addTag(caption);
	card.addTag(processCaption);
	card.addTag(typeStr);
	card.setImage('./img/default.png');

}




function htmlFromTags(card)
{
	var tags = card.getTags();

	var result = "";

	for (var i = 0; i < tags.length; i++)
	{
		if (toSingleWord(tags[i]) !== gCurrentEvaluationTags[0]){
			result += '<div class="card-tag"><div class="card-tag-caption" data-source="' + toSingleWord(tags[i]) + '">' + tags[i] + '</div></div>' ;
		}
	}

	return result;
	
}

function htmlFromCard(card)
{
	var cardScore = {0 : 0, 1 : 0, 2 : 10, 3: 30, 4 : 50, 5 : 60, 6 : 75, 7 : 90, 8 : 100};
	var scoreLabel = {0 :'fail', 1 : 'new', 2 : 'low', 3: 'average', 4 : 'good', 5 : 'great', 6 : 'strong', 7 : 'master', 8 : 'genius'};
	var html = `
	<div class="task-card swipedInCard" id="{0}" >
				<div class="card-pin"></div>
				<div class="card-title">
					<div class="avatar-container"><img src="{5}" alt="project furnace" class="user-small-avatar" ></div>
					<h3>{1}</h3>
					<!--div class="btn-edit-task" data-source="{0}"></div-->
				</div>
				<div class="card-content">
					
					<div class="task-description">
					
					{2}
					</div>
					<div class="tag-container">
						{3}<!--div class="btn-edit-tags" data-source="{0}"></div-->
					</div>

				</div>

				<div class="circular-progress"><div class="c100 p{6} small ">    <span data-from="0" data-to="{6}" class="project-progress">{7}</span>    <div class="slice">        <div class="bar"></div>        <div class="fill"></div>    </div></div><h3>card score</h3></div>

				<div class="circular-progress"><div class="c100 p{8} small ">    <span data-from="0" data-to="{8}" class="project-progress">{9}</span>    <div class="slice">        <div class="bar"></div>        <div class="fill"></div>    </div></div><h3>set score</h3></div>

				<div class="card-footer">
					
					<div class="card-bottom-btn-container">
						<div class="btn-expand-card" data-source="{0}">
						</div>
						
						<div>
							 Reveal answer.
						</div>

						

					</div>
				</div>
			</div>

	`;



	var avgScore = gCardCollection.fetchAverageScore();

	return String.format(
		html,
		card.id(),
		card.getCaption(),
		markdown.toHTML(card.getRecto()),
		htmlFromTags(card),
		card.getTags()[1],
		card.getImage(),
		cardScore[card._lastBucketIndex].toString(),
		scoreLabel[card._lastBucketIndex],
		cardScore[avgScore].toString(),
		scoreLabel[avgScore]
	);
}





function initService()
{

	var data = localStorage.getItem(app_id + ".cards");
	var o = null;
	if (typeof(data) === "undefined" || data === null)
	{
		o = {
			"6XJtY5SiUhy7m":
				{
					"_id":"6XJtY5SiUhy7m",
					"_caption":"Create card collection",
					"_recto":"![how to](img/man-question-01.jpg \"How to\")\n\nHow do I create my **first card collection**?",
					"_verso":"###Answer###\n\nWell, just make sure you are on the home page:\n> ![how to](img/icon-home.png \"How to\") \n\nthen press: \n> ![how to](img/icon-plus.png \"How to\") \n\nand that is it!",
					"_tags":["get started","tutorial","8BXoW62xFhy7m"],
					"_img":"./img/default.png",
					"_score": 2,
					"_lastEval":25332030,
					"_lastBucketIndex":1
				},
			"RFEKc4bsSjy7m":
				{
					"_id":"RFEKc4bsSjy7m",
					"_caption":"Add card to a collection",
					"_recto":"![how to](img/man-question-03.jpg \"How to\")\n\nHow do I **add a card** to an existing collection?",
					"_verso":"###Answer###\n\nWell, if you are on the home page:\n> ![how to](img/icon-home.png \"How to\") \n\nswipe the card collection to the right: \n> ![how to](img/swipe-right.png \"How to\") \n\nthen press the \"list\" icon to reveal the list of card in this collection: \n> ![how to](img/icon-list.png \"How to\") \n\nthen press the \"plus\" icon at the bottom of the list to add a new card to this collection: \n> ![how to](img/icon-plus.png \"How to\") \n\nand that is it!",
					"_tags":["get started","tutorial","8BXoW62xFhy7m"],
					"_img":"./img/default.png",
					"_score": 2,
					"_lastEval":25332030,
					"_lastBucketIndex":1
				},
			"vo43P7Rfkly7m":
				{
					"_id":"vo43P7Rfkly7m",
					"_caption":"Edit an existing card",
					"_recto":"![how to](img/man-question-02.jpg \"How to\")\n\nHow do I **edit an existing card**?",
					"_verso":"###Answer###\n\nWell, go back to the home page:\n> ![how to](img/icon-home.png \"How to\") \n\nthen swipe the card collection to the right (the one to which the card you want to edit belongs to): \n> ![how to](img/swipe-right.png \"How to\") \n\nthen press the \"list\" icon to reveal the list of card in this collection: \n> ![how to](img/icon-list.png \"How to\") \n\nthen press the entry corresponding to your card and an editing window will popup.",
					"_tags":["get started","tutorial","8BXoW62xFhy7m"],
					"_img":"./img/default.png",
					"_score": 2,
					"_lastEval":25332030,
					"_lastBucketIndex":1
				},
			"u3quc4O6voy7m":
				{
					"_id":"u3quc4O6voy7m",
					"_caption":"How to style the text",
					"_recto":"![how to](img/man-question-04.jpg \"How to\")\n\nIs it possible to style the text on the card and get stuff such as\n\nA list:\n\n* Item 1\n* Item 2\n* Item 3\n\n\n\nHave titles\n\n###I am a title###\n\nA text **in bold** or _in italics_  ?\n",
					"_verso":"###Answer###\n\nYes you can, the text is interpreted as markdown syntax and you can learn more about markdown syntax [here](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)",
					"_tags":["get started","tutorial","8BXoW62xFhy7m"],
					"_img":"./img/default.png",
					"_score": 2,
					"_lastEval":25332030,
					"_lastBucketIndex":1
				}
			};

	}
	else
	{
		o = JSON.parse(data);
	}


	var newEvalDate =  Math.floor(Date.now() / 60000);
	Object.keys(o).forEach(
		function(key) {
	    	var card = new Card(o[key]);
	    	var newScore = card.getScore() - (newEvalDate - card.getLastEval());
	    	newScore = (0 > newScore) ? 0 : newScore;
	    	card.setScore(newScore);
	    	card.setLastEval(newEvalDate);
	});

	NB_QUESTION_PER_ROUND = Number(localStorage.getItem(app_id + ".nbquestion"));


	if (typeof(NB_QUESTION_PER_ROUND) === "undefined" || NB_QUESTION_PER_ROUND === null  || NB_QUESTION_PER_ROUND < 6)
	{
		NB_QUESTION_PER_ROUND = 6;
	}
	localStorage.setItem(app_id + ".nbquestion", NB_QUESTION_PER_ROUND.toString());
	$("select#nbquestion-combo").val(localStorage.getItem(app_id + ".nbquestion"));
}


function newCard()
{
	$('#card-id-hidden').val('newcard');
	 		$('#card-caption-edit').val('');
	 		$('#card-recto-edit').val('');
	 		$('#card-verso-edit').val('');
	 		$('#card-tags-edit').html('');

	 		$("#editCardModal").addClass('active');
}





function startEvaluation()
{

	gCurrentQuestionNb = 0;

	gCardCollection = new CardCollection(gCurrentEvaluationTags);
	gCurrentDeck = gCardCollection.getCards(NB_QUESTION_PER_ROUND, true);

	if (gCurrentDeck.length !== 0)
	{
		var card = gCurrentDeck[0];
		$('.testbenchcontent').html(htmlFromCard(card));
	}
	else
	{
		newCard();
	}


}

function nextQuestion()
{
	gCurrentQuestionNb++;
	if (gCurrentQuestionNb ===  NB_QUESTION_PER_ROUND || gCurrentQuestionNb === gCurrentDeck.length )
	{
		startEvaluation();
	}

	var card = gCurrentDeck[gCurrentQuestionNb];

	$('.task-card').addClass('swipedOutCard');


	setTimeout(
		function() { 
				$('.swipedOutCard').remove();
				saveCards();
			 }
	, 1490);

	setTimeout(
		function() { 
				$('.testbenchcontent').prepend(htmlFromCard(card));
			}
	, 30);


	setTimeout(
		function() { 
				saveCards();
			 }
	, 3500);
	
}



function exportModal(id)
{
	var col = new CardCollection([id]);
	var deck = col.getCards(9999, true);


	$('#jsondata').val(JSON.stringify(deck));
	$('#exportid').val(id);
	$('#checklist-description').val('');


	$("#exportModal").addClass('active');
}





/******************************** CLICK HANDLING ****************************/

function clickPerformed(evt)
{
	lastClickedObject = $(evt.target);


	if (lastClickedObject.is('li.table-view-cell') && !lastClickedObject.is('li.edit-card'))
	{
		gCurrentEvaluationTags = [lastClickedObject.attr("data-source")];	

		$('.title').text($(lastClickedObject).text());

		$('.slide-groupx').css('transition-duration', '0.4s');
		$('.slide-groupx').css('transform', 'translate3d(-50%, 0px, 0px)');

		setTimeout(
			function() { startEvaluation(); },
			200
		);
	
	}
	else if (lastClickedObject.is('span#new-action-item'))
	{
		
		$('.table-view').append(addActionItemAsHTML());
		
	}
	else if (lastClickedObject.is('span.icon.icon-trash')) 
	{
		var id =  lastClickedObject.attr("data-source");

		$("#" + id).remove();
		coreDeleteActionItem(id);
		// TODO:
		// Test if children action item otherwise popup + remove real objects and susequent childrens
	}
	else if (lastClickedObject.is('span.icon.icon-compose'))
	{
		var id =  lastClickedObject.attr("data-source");
		var caption = ACTIONS[id].caption;
		// TODO: 
		// fetch real name from id
		$("#" + id).replaceWith(captionEditAsHTML(caption, id));
	}
	else if (lastClickedObject.is('span.icon.icon-share'))
	{
		var id =  lastClickedObject.attr("data-source");

		exportModal(id);
	}
	else if (lastClickedObject.is('.checklist-download'))
	{
		var id = lastClickedObject.attr("data-source");
		$.ajaxSetup(
		    {
		      crossDomain: true,
		      cache: false
		    }
		  );

		$('#downloadModal').removeClass('active');


		var w = "ID='" + id + "\'";

		  var jqxhr = $.post(
		    "http://nicebrain.projectfurnace.org/php/field_request.php",
		    { where : w.toString(), field : "JSONDATA,CAPTION" }
		  );


		  jqxhr.done(
		    function(raw_data)
		    {
		      if (raw_data != null && raw_data.length > 2)
			  {
			    var tmp = raw_data.substring(0, raw_data.length - 3);
			    var response = JSON.parse(tmp);
			    var obj = JSON.parse(response.JSONDATA);

			    for (var i = 0; i < obj.length; i++)
			    {
			    	CARDS[obj[i].id] = new Card(obj[i]);
			    }

			    if (ACTIONS['top-level'].children.indexOf(id) === -1)
			    {
			    	ACTIONS['top-level'].children.push(id);
			    	ACTIONS[id] = {caption: response.CAPTION, id: id, children: [], checked: false, parent: 'top-level'};
			    	saveMenuEntries();
			    }


			   

			    saveCards();
			  }
		    }
		  );

		  jqxhr.fail(
		    function()
		    {

		    }
		  );
	}
	else if (lastClickedObject.is('span.icon.icon-download') )
	{
		$('#download-list').html('');

		$('#downloadModal').addClass('active');

		$.ajaxSetup(
		    {
		      crossDomain: true,
		      cache: false
		    }
		  );

		  var jqxhr = $.post(
		    "http://nicebrain.projectfurnace.org/php/field_request.php",
		    { where : "1", field : "ID,CAPTION,DESCRIPTION,CATEGORY" }
		  );


		  jqxhr.done(
		    function(raw_data)
		    {
		      if (raw_data != null && raw_data.length > 2)
			  {
			    var tmp = raw_data.substring(0, raw_data.length - 3);
			    var strArray = tmp.split('~');

			    var html = '';

			    for (var i = 0; i < strArray.length; i++)
			    {
			    	var response = JSON.parse(strArray[i]);
			    	tmp = `<li class="table-view-cell media checklist-download" data-source="{0}">
							    <a class="navigate-right checklist-download" data-source="{0}">
							      <img class="media-object pull-left" src="img/{3}.png">
							      <div class="media-body checklist-download" data-source="{0}">
							        {1}
							        <p class="checklist-download" data-source="{0}">{2}</p>
							      </div>
							    </a>
							  </li>`;

					html += String.format(tmp, response.ID, response.CAPTION, response.DESCRIPTION, response.CATEGORY);

					
			    }

			    $('#download-list').html(html);
			  }
		    }
		  );

		  jqxhr.fail(
		    function()
		    {

		    }
		  );
	}
	else if (lastClickedObject.is('#export-btn'))
	{
		var id = $('#exportid').val();
		var data = $('#jsondata').val();
		var desc = $('#checklist-description').val();
		var category = $('#export-category').val();

	 	$('#exportModal').removeClass('active');

	 	$.ajaxSetup(
		    {
		      crossDomain: true,
		      cache: false
		    }
		  );
	 	

	 	var jqxhr = $.post(
		    "http://nicebrain.projectfurnace.org/php/commit.php",
		    { id : id, data : data,  category : Number(category), description: desc, caption: ACTIONS[id].caption }
		  );

		  jqxhr.done(
		    function(d) 
		    {
		      	$('.title').text('export successful');
		    }
		  );

		  jqxhr.fail(
		    function()
		    {
		      	$('.title').text('export failed');
		    }
		  );

		refreshUI(false);


	 }
	else if (lastClickedObject.is('span.icon.icon-list')  || lastClickedObject.is('a.navigate-right') )
	{ 
		var id = lastClickedObject.attr("data-source");
		gCurrentEvaluationTags = [id];

		$('.title').text(ACTIONS[id].caption);

		listCardCollection();

	}
	else if (lastClickedObject.is('li.edit-card') || lastClickedObject.is('span#new-card'))
	{
		var card = CARDS[lastClickedObject.attr("data-source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		$('#card-id-hidden').val(card.id());
	 		$('#card-caption-edit').val(card.getCaption());
	 		$('#card-recto-edit').val(card.getRecto());
	 		$('#card-verso-edit').val(card.getVerso());
	 		$('#card-tags-edit').html(htmlFromTags(card));

	 		$("#editCardModal").addClass('active');
	 	}
	 	else
	 	{
	 		newCard();
	 	}
	
	}
	else if (lastClickedObject.is('#save-card'))
	{
		var id = $('#card-id-hidden').val();
		var card = CARDS[id];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		card.setCaption($('#card-caption-edit').val());
	 		card.setRecto($('#card-recto-edit').val());
	 		card.setVerso($('#card-verso-edit').val());
	 	}
	 	else
	 	{
	 		card = new Card(null, $('#card-recto-edit').val(), $('#card-verso-edit').val());
	 		card.setCaption($('#card-caption-edit').val());
	 		for (var i = 0; i < gCurrentEvaluationTags.length; i++){
	 			card.addTag(gCurrentEvaluationTags[i]);
	 		}
	 	}

	 	$('#editCardModal').removeClass('active');
	 	listCardCollection();

	 	saveCards();
	 }
	else if (lastClickedObject.is('button.btn.btn-link.btn-nav.pull-left')  || lastClickedObject.is('span.icon.icon-left-nav') )
	{
		PARENTID =  lastClickedObject.attr("data-source");
		refreshUI(true);

		

	}
	else if (lastClickedObject.is('span.icon.icon-home') )
	{
		PARENTID = 'top-level'; 
		refreshUI(true);
		$('.slide-groupx').css('transition-duration', '0.4s');
		$('.slide-groupx').css('transform', 'translate3d(0px, 0px, 0px)');
		$('.testbenchcontent').html("");
	}
	else if (lastClickedObject.is('div.toggle-handle') || lastClickedObject.is('div.toggle'))
	{
		var id = lastClickedObject.attr("data-source");
		var action = ACTIONS[id];
		action.checked = $("#toggle-" + id).hasClass("active");

		if (action.parent !== null)
		{
			var parent = ACTIONS[action.parent];
			parent.checked = true;
			for (var i = 0; i < parent.children.length; i++)
			{
				if (ACTIONS[parent.children[i]].checked === false)
				{
					parent.checked = false;
					break;
				}
			}
		}
		saveMenuEntries();
	}
	else if (lastClickedObject.is("div.btn-expand-card"))
	{
		var card = CARDS[$(lastClickedObject).data("source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		//$('#' + card.id()).addClass('revealedCard');
	 		var html = `
	 					<div>

							{0}
							
						</div>

						<div>
							<div class="rating-btn easy" data-source="{1}">EASY</div>
							<div class="rating-btn medium" data-source="{1}">MEDIUM</div>
							<div class="rating-btn hard" data-source="{1}">HARD</div>
							<div class="rating-btn fail" data-source="{1}">FAIL</div>
						</div>
	 		`;
	 		$(".card-footer").html(String.format(html, markdown.toHTML(card.getVerso()), card.id()));
	 	}	
	}
	else if (lastClickedObject.is("div.rating-btn.easy"))
	{
		var card = CARDS[$(lastClickedObject).data("source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		card.rateCard("easy");
	 	}
	 	nextQuestion();
	}
	else if (lastClickedObject.is("div.rating-btn.medium"))
	{
		var card = CARDS[$(lastClickedObject).data("source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		card.rateCard("medium");
	 	}
	 	nextQuestion();
	}
	else if (lastClickedObject.is("div.rating-btn.hard"))
	{
		var card = CARDS[$(lastClickedObject).data("source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		card.rateCard("hard");
	 	}
	 	nextQuestion();
	}
	else if (lastClickedObject.is("div.rating-btn.fail"))
	{
		var card = CARDS[$(lastClickedObject).data("source")];
		if (typeof(card) !== "undefined" && (card instanceof Card))
	 	{
	 		card.rateCard("fail");
	 	}
	 	nextQuestion();
	}
	else if (lastClickedObject.is("div.card-tag-caption"))
	{
		var id = $(lastClickedObject).data("source");
		gCurrentEvaluationTags = [id];

		var tag = TAGS[id]
		if (tag instanceof Tag)
		{
			$('.title').text(tag.getCaption());
		}

		startEvaluation();
	}
}



function addEntry(caption)
{
	var t = "PMBOK 6th Ed (" + caption + ")";
	ACTIONS[caption] = {caption: t, id: caption, children: Array(0), checked: false, parent: "top-level"};
	if (ACTIONS['top-level'].children.indexOf(caption) === -1)
    {
    	ACTIONS['top-level'].children.push(caption);
    }
	saveMenuEntries();
}











